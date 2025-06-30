import * as path from 'path';
import * as fs from 'fs-extra';
import {
	ToolDefinition,
	ToolValidationResult
} from '../types';
import { ToolExecutionError } from '../types/errors';

export class ToolRegistry {
	private tools: Map<string, ToolDefinition> = new Map();
	private categories: Map<string, string[]> = new Map();

	constructor() {
		this.registerDefaultTools();
	}

	private registerDefaultTools(): void {
		this.registerTool({
			name: 'read_file',
			category: 'file',
			description: '读取项目中的文件内容',
			parameters: {
				type: 'object',
				properties: {
					file_path: {
						type: 'string',
						description: '相对于项目根目录的文件路径',
						required: true
					}
				},
				required: ['file_path']
			},
			validator: (params) => this.validateFilePath(params.file_path),
			executor: async (params, context) => {
				const filePath = path.resolve(context?.projectPath || process.cwd(), params.file_path);

				if (!await fs.pathExists(filePath)) {
					throw new Error(`文件不存在: ${params.file_path}`);
				}

				const content = await fs.readFile(filePath, 'utf8');
				return { content, size: content.length, path: filePath };
			}
		});

		this.registerTool({
			name: 'write_file',
			category: 'file',
			description: '写入或修改项目中的文件',
			parameters: {
				type: 'object',
				properties: {
					file_path: {
						type: 'string',
						description: '相对于项目根目录的文件路径',
						required: true
					},
					content: {
						type: 'string',
						description: '要写入的文件内容',
						required: true
					},
					backup: {
						type: 'boolean',
						description: '是否创建备份文件',
						default: true
					}
				},
				required: ['file_path', 'content']
			},
			validator: (params) => {
				const fileValidation = this.validateFilePath(params.file_path);
				if (!fileValidation.valid) return fileValidation;

				return this.validateContent(params.content);
			},
			executor: async (params, context) => {
				const filePath = path.resolve(context?.projectPath || process.cwd(), params.file_path);

				// 创建备份
				if (params.backup !== false && await fs.pathExists(filePath)) {
					const backupPath = `${filePath}.backup.${Date.now()}`;
					await fs.copy(filePath, backupPath);
				}

				// 确保目录存在
				await fs.ensureDir(path.dirname(filePath));

				// 写入文件
				await fs.writeFile(filePath, params.content, 'utf8');

				return {
					success: true,
					path: filePath,
					size: params.content.length
				};
			}
		});

		this.registerTool({
			name: 'list_files',
			category: 'file',
			description: '列出目录中的文件',
			parameters: {
				type: 'object',
				properties: {
					directory: {
						type: 'string',
						description: '要列出的目录路径',
						default: '.'
					},
					pattern: {
						type: 'string',
						description: '文件匹配模式（glob）',
						default: '**/*'
					},
					exclude: {
						type: 'array',
						description: '要排除的模式',
						default: ['node_modules/**', '.git/**', 'dist/**']
					}
				},
				required: []
			},
			executor: async (params, context) => {
				const dirPath = path.resolve(context?.projectPath || process.cwd(), params.directory || '.');
				const files: string[] = [];

				const scan = async (dir: string, relativePath: string = '') => {
					const items = await fs.readdir(dir);

					for (const item of items) {
						const fullPath = path.join(dir, item);
						const relPath = path.join(relativePath, item);

						// 检查排除模式
						const shouldExclude = (params.exclude || []).some((pattern: string) =>
							relPath.includes(pattern.replace('/**', ''))
						);

						if (shouldExclude) continue;

						const stat = await fs.stat(fullPath);

						if (stat.isDirectory()) {
							await scan(fullPath, relPath);
						} else {
							files.push(relPath);
						}
					}
				};

				await scan(dirPath);
				return { files, count: files.length };
			}
		});

		// 系统命令工具
		this.registerTool({
			name: 'run_command',
			category: 'system',
			description: '在项目目录中执行命令行命令',
			parameters: {
				type: 'object',
				properties: {
					command: {
						type: 'string',
						description: '要执行的命令',
						required: true
					},
					args: {
						type: 'array',
						description: '命令参数数组',
						default: []
					},
					working_directory: {
						type: 'string',
						description: '执行命令的工作目录',
						default: '.'
					},
					timeout: {
						type: 'number',
						description: '命令超时时间（毫秒）',
						default: 30000
					}
				},
				required: ['command']
			},
			validator: (params) => this.validateCommand(params.command, params.args),
			executor: async (params, context) => {
				const { execSync } = require('child_process');
				const workingDir = path.resolve(context?.projectPath || process.cwd(), params.working_directory || '.');

				try {
					const fullCommand = params.args && params.args.length > 0
						? `${params.command} ${params.args.join(' ')}`
						: params.command;

					const output = execSync(fullCommand, {
						cwd: workingDir,
						encoding: 'utf8',
						timeout: params.timeout || 30000,
						maxBuffer: 1024 * 1024 // 1MB
					});

					return {
						success: true,
						output: output.toString(),
						command: fullCommand,
						workingDirectory: workingDir
					};
				} catch (error: any) {
					throw new ToolExecutionError(
						`命令执行失败: ${error.message}`,
						'run_command',
						`命令: ${params.command}`
					);
				}
			}
		});
	}

	public registerTool(toolDefinition: ToolDefinition): void {
		const { name, category, description, parameters, validator, executor } = toolDefinition;

		if (!name || !description || !parameters) {
			throw new Error('工具定义必须包含 name, description 和 parameters');
		}

		this.tools.set(name, {
			name,
			category: category || 'general',
			description,
			parameters,
			validator: validator || (() => ({ valid: true })),
			executor: executor || null
		});

		// 按类别分组
		const cat = category || 'general';
		if (!this.categories.has(cat)) {
			this.categories.set(cat, []);
		}
		this.categories.get(cat)!.push(name);
	}

	public getTool(name: string): ToolDefinition | undefined {
		return this.tools.get(name);
	}

	public getAllTools(): ToolDefinition[] {
		return Array.from(this.tools.values());
	}

	public getToolsByCategory(category: string): ToolDefinition[] {
		const toolNames = this.categories.get(category) || [];
		return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
	}

	public getCategories(): string[] {
		return Array.from(this.categories.keys());
	}

	public getToolsDescription(): string {
		const tools = this.getAllTools();
		return tools.map(tool =>
			`${tool.name}: ${tool.description}`
		).join('\n');
	}

	public getToolsSchema(): any {
		const tools = this.getAllTools();
		return tools.map(tool => ({
			name: tool.name,
			description: tool.description,
			parameters: tool.parameters
		}));
	}

	// 验证方法
	private validateFilePath(filePath: string): ToolValidationResult {
		if (!filePath || typeof filePath !== 'string') {
			return { valid: false, error: '文件路径不能为空' };
		}

		// 检查路径安全性
		const normalizedPath = path.normalize(filePath);
		if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
			return { valid: false, error: '不允许访问项目目录外的文件' };
		}

		return { valid: true };
	}

	private validateContent(content: string): ToolValidationResult {
		if (typeof content !== 'string') {
			return { valid: false, error: '文件内容必须是字符串' };
		}

		// 检查内容大小（限制为10MB）
		if (content.length > 10 * 1024 * 1024) {
			return { valid: false, error: '文件内容过大（超过10MB）' };
		}

		return { valid: true };
	}

	private validateCommand(command: string, args: string[] = []): ToolValidationResult {
		if (!command || typeof command !== 'string') {
			return { valid: false, error: '命令不能为空' };
		}

		// 允许的命令白名单
		const allowedCommands = [
			'npm', 'yarn', 'pnpm', 'cnpm',
			'node', 'npx', 'nvm',
			'git',
			'webpack', 'vite', 'rollup', 'babel',
			'gulp', 'grunt',
			'jest', 'mocha', 'vitest',
			'eslint', 'prettier', 'tslint',
			'tsc', 'typescript',
			'ls', 'dir', 'cat', 'type', 'head', 'tail',
			'mkdir', 'rmdir', 'find', 'grep',
			'cp', 'mv', 'rm', 'chmod',
			'echo', 'pwd', 'which', 'where',
			'vue', 'ng', 'react-scripts'
		];

		const cmdName = command.split(' ')[0];
		if (!allowedCommands.includes(cmdName)) {
			return {
				valid: false,
				error: `不允许执行的命令: ${cmdName}。允许的命令: ${allowedCommands.join(', ')}`
			};
		}

		return { valid: true };
	}

	public hasTool(name: string): boolean {
		return this.tools.has(name);
	}

	public removeTool(name: string): boolean {
		const tool = this.tools.get(name);
		if (!tool) return false;

		this.tools.delete(name);

		// 从类别中移除
		const category = tool.category || 'general';
		const categoryTools = this.categories.get(category);
		if (categoryTools) {
			const index = categoryTools.indexOf(name);
			if (index > -1) {
				categoryTools.splice(index, 1);
			}

			// 如果类别为空，删除类别
			if (categoryTools.length === 0) {
				this.categories.delete(category);
			}
		}

		return true;
	}

	public clear(): void {
		this.tools.clear();
		this.categories.clear();
	}
}
