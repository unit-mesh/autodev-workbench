#!/usr/bin/env node

const { Command } = require('commander')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')

// 动态导入框架（支持TypeScript编译后的版本）
let framework
try {
	framework = require('../lib/index.js')
} catch (error) {
	// 开发模式下直接使用TypeScript源码
	try {
		require('ts-node/register')
		framework = require('../src/index.ts')
	} catch (tsError) {
		console.error(chalk.red('❌ 无法加载框架，请确保已正确安装和构建'))
		console.error('构建命令: npm run build')
		process.exit(1)
	}
}

const {
	createMigrationOrchestrator,
	createMigrationContext,
	ConfigManager,
	getFrameworkStatus,
	checkDependencies
} = framework

const program = new Command()

// 版本信息
program
	.name('ai-migration')
	.description('通用AI辅助迁移框架CLI工具')
	.version(framework.VERSION || '1.0.0')

// 全局选项
program
	.option('-v, --verbose', '显示详细信息')
	.option('--dry-run', '预览模式，不实际修改文件')
	.option('--ai-key <key>', '指定AI API密钥')
	.option('--config <path>', '指定配置文件路径')

/**
 * 迁移命令
 */
program
	.command('migrate')
	.description('执行项目迁移')
	.argument('<project-path>', '项目路径')
	.option('-p, --preset <preset>', '使用预设配置', 'vue2-to-vue3')
	.option('--source <version>', '源版本')
	.option('--target <version>', '目标版本')
	.option('--skip-backup', '跳过备份')
	.option('--skip-validation', '跳过验证')
	.action(async (projectPath, options) => {
		try {
			console.log(chalk.blue('🚀 开始项目迁移'))
			console.log(chalk.gray(`项目路径: ${projectPath}`))
			console.log(chalk.gray(`预设配置: ${options.preset}`))

			// 检查项目路径
			if (!await fs.pathExists(projectPath)) {
				throw new Error(`项目路径不存在: ${projectPath}`)
			}

			// 加载配置
			const configManager = new ConfigManager()
			if (program.opts().config) {
				await configManager.loadFromFile(program.opts().config)
			}
			configManager.loadFromEnvironment()

			// 应用命令行选项
			const config = configManager.getConfig()
			config.dryRun = program.opts().dryRun || config.dryRun
			config.verbose = program.opts().verbose || config.verbose
			config.aiApiKey = program.opts().aiKey || config.aiApiKey

			// 创建迁移编排器
			const orchestrator = createMigrationOrchestrator({
				...config,
				preset: options.preset
			})

			// 设置事件监听
			orchestrator.on('phase:change', (data) => {
				console.log(chalk.yellow(`📍 阶段变更: ${data.phase}`))
			})

			orchestrator.on('progress:update', (progress) => {
				console.log(chalk.green(`📊 进度: ${progress}%`))
			})

			orchestrator.on('error:add', (data) => {
				console.log(chalk.red(`⚠️  错误: ${data.error.message}`))
			})

			// 执行迁移
			const context = await orchestrator.initialize(projectPath, config)
			const result = await orchestrator.execute()

			console.log(chalk.green('✅ 迁移完成'))

			// 生成报告
			if (result && config.reporting?.enabled) {
				await generateReport(result, projectPath)
			}

		} catch (error) {
			console.error(chalk.red('❌ 迁移失败:'), error.message)
			if (program.opts().verbose) {
				console.error(error.stack)
			}
			process.exit(1)
		}
	})

/**
 * 分析命令
 */
program
	.command('analyze')
	.description('分析项目结构和迁移可行性')
	.argument('<project-path>', '项目路径')
	.option('-o, --output <path>', '输出报告路径')
	.action(async (projectPath, options) => {
		try {
			console.log(chalk.blue('🔍 开始项目分析'))

			const orchestrator = createMigrationOrchestrator({
				dryRun: true,
				verbose: program.opts().verbose
			})

			const context = await orchestrator.initialize(projectPath)

			// 只执行分析阶段
			console.log(chalk.yellow('📋 执行项目分析...'))
			// 这里需要实现分析逻辑

			console.log(chalk.green('✅ 分析完成'))

		} catch (error) {
			console.error(chalk.red('❌ 分析失败:'), error.message)
			process.exit(1)
		}
	})

/**
 * 配置命令
 */
program
	.command('config')
	.description('管理配置')
	.option('--init', '初始化配置文件')
	.option('--show', '显示当前配置')
	.option('--validate', '验证配置文件')
	.action(async (options) => {
		try {
			if (options.init) {
				await initConfig()
			} else if (options.show) {
				await showConfig()
			} else if (options.validate) {
				await validateConfig()
			} else {
				console.log(chalk.yellow('请指定配置操作: --init, --show, 或 --validate'))
			}
		} catch (error) {
			console.error(chalk.red('❌ 配置操作失败:'), error.message)
			process.exit(1)
		}
	})

/**
 * 状态命令
 */
program
	.command('status')
	.description('显示框架状态信息')
	.action(() => {
		try {
			const status = getFrameworkStatus()
			const deps = checkDependencies()

			console.log(chalk.blue('📊 框架状态信息:'))
			console.log(chalk.gray(`名称: ${status.name}`))
			console.log(chalk.gray(`版本: ${status.version}`))
			console.log(chalk.gray(`描述: ${status.description}`))

			console.log(chalk.blue('\n🔧 依赖状态:'))
			if (deps.satisfied) {
				console.log(chalk.green('✅ 所有必需依赖已满足'))
			} else {
				console.log(chalk.red('❌ 缺少必需依赖:'))
				deps.missing.forEach(dep => {
					console.log(chalk.red(`  - ${dep}`))
				})
			}

			if (deps.optional.length > 0) {
				console.log(chalk.yellow('\n⚠️  可选依赖未安装:'))
				deps.optional.forEach(dep => {
					console.log(chalk.yellow(`  - ${dep}`))
				})
			}

		} catch (error) {
			console.error(chalk.red('❌ 获取状态失败:'), error.message)
			process.exit(1)
		}
	})

/**
 * 预设命令
 */
program
	.command('presets')
	.description('管理迁移预设')
	.option('--list', '列出可用预设')
	.option('--show <name>', '显示预设详情')
	.action(async (options) => {
		try {
			const configManager = new ConfigManager()

			if (options.list) {
				const presets = configManager.getAllPresets()
				console.log(chalk.blue('📋 可用预设:'))

				for (const [name, preset] of presets) {
					console.log(chalk.green(`  ${name}`))
					console.log(chalk.gray(`    ${preset.description}`))
					console.log(chalk.gray(`    ${preset.source.framework} ${preset.source.version} → ${preset.target.framework} ${preset.target.version}`))
				}
			} else if (options.show) {
				const preset = configManager.getPreset(options.show)
				if (preset) {
					console.log(chalk.blue(`📋 预设详情: ${options.show}`))
					console.log(JSON.stringify(preset, null, 2))
				} else {
					console.log(chalk.red(`❌ 预设不存在: ${options.show}`))
				}
			} else {
				console.log(chalk.yellow('请指定操作: --list 或 --show <name>'))
			}

		} catch (error) {
			console.error(chalk.red('❌ 预设操作失败:'), error.message)
			process.exit(1)
		}
	})

// ============================================================================
// 辅助函数
// ============================================================================

async function generateReport (result, projectPath) {
	const reportDir = path.join(projectPath, 'migration-reports')
	await fs.ensureDir(reportDir)

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	const reportPath = path.join(reportDir, `migration-report-${timestamp}.json`)

	await fs.writeJson(reportPath, result, { spaces: 2 })
	console.log(chalk.green(`📄 迁移报告已生成: ${reportPath}`))
}

async function initConfig () {
	const configPath = './ai-migration.config.json'

	if (await fs.pathExists(configPath)) {
		console.log(chalk.yellow('⚠️  配置文件已存在'))
		return
	}

	const configManager = new ConfigManager()
	const template = configManager.generateTemplate()

	await fs.writeJson(configPath, template, { spaces: 2 })
	console.log(chalk.green(`✅ 配置文件已创建: ${configPath}`))
}

async function showConfig () {
	const configPath = program.opts().config || './ai-migration.config.json'

	try {
		const configManager = new ConfigManager()
		if (await fs.pathExists(configPath)) {
			await configManager.loadFromFile(configPath)
		}

		const config = configManager.getConfig()
		console.log(chalk.blue('📋 当前配置:'))
		console.log(JSON.stringify(config, null, 2))

	} catch (error) {
		console.log(chalk.yellow('使用默认配置'))
		const configManager = new ConfigManager()
		const config = configManager.getConfig()
		console.log(JSON.stringify(config, null, 2))
	}
}

async function validateConfig () {
	const configPath = program.opts().config || './ai-migration.config.json'

	try {
		const configManager = new ConfigManager()

		if (await fs.pathExists(configPath)) {
			await configManager.loadFromFile(configPath)
			console.log(chalk.green(`✅ 配置文件加载成功: ${configPath}`))
		} else {
			console.log(chalk.yellow('⚠️  配置文件不存在，使用默认配置'))
		}

		const validation = configManager.validateConfig()

		if (validation.valid) {
			console.log(chalk.green('✅ 配置验证通过'))
		} else {
			console.log(chalk.red('❌ 配置验证失败:'))
			validation.errors.forEach(error => {
				console.log(chalk.red(`  - ${error}`))
			})
		}

	} catch (error) {
		console.log(chalk.red(`❌ 配置验证失败: ${error.message}`))
	}
}

// 错误处理
process.on('uncaughtException', (error) => {
	console.error(chalk.red('💥 未捕获的异常:'), error.message)
	if (program.opts().verbose) {
		console.error(error.stack)
	}
	process.exit(1)
})

process.on('unhandledRejection', (reason) => {
	console.error(chalk.red('💥 未处理的Promise拒绝:'), reason)
	process.exit(1)
})

// 解析命令行参数
program.parse()
