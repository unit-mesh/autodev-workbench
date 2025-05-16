import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { Command } from 'commander';

import { AppConfig, DEFAULT_CONFIG } from "../types/AppConfig";

export class CommandLineParser {
	public parse(): AppConfig {
		const program = new Command();

		program
			.name('context-worker')
			.description('AutoDev Context Worker - Code analysis and context building tool')
			.version('1.0.0');

		program
			.option('-p, --path <dir>', 'Directory path to scan', DEFAULT_CONFIG.dirPath)
			.option('-u, --upload', 'Upload analysis results to server', DEFAULT_CONFIG.upload)
			.option('--server-url <url>', 'Server URL for uploading results', DEFAULT_CONFIG.baseUrl)
			.option('-o, --output-dir <dir>', 'Output directory for learning materials', DEFAULT_CONFIG.outputDir)
			.option('-n, --non-interactive', 'Run in non-interactive mode', DEFAULT_CONFIG.nonInteractive)
			.option('--output-file <file>', 'JSON output file name', DEFAULT_CONFIG.outputJsonFile)
			.option('--interface', 'Process interface context only', false)
			.option('--api', 'Process API context only', true)
			.option('--project-id <id>', 'Project ID for organization', DEFAULT_CONFIG.projectId);

		program.parse(process.argv);

		const options = program.opts();

		let contextType: 'api' | 'interface' = 'api';
		if (options.api && options.interface) {
			throw new Error('Cannot specify both --api and --interface');
		} else if (options.interface) {
			contextType = 'interface';
		}

		let dirPath = options.path;
		if (!path.isAbsolute(dirPath)) {
			dirPath = path.resolve(process.cwd(), dirPath);
		}

		return {
			dirPath,
			upload: options.upload || DEFAULT_CONFIG.upload,
			baseUrl: options.serverUrl || DEFAULT_CONFIG.baseUrl,
			outputDir: options.outputDir || DEFAULT_CONFIG.outputDir,
			nonInteractive: options.nonInteractive || DEFAULT_CONFIG.nonInteractive,
			contextType,
			outputJsonFile: options.outputFile || DEFAULT_CONFIG.outputJsonFile,
			projectId: options.projectId || DEFAULT_CONFIG.projectId
		};
	}
}

export class UserInputHandler {
	public async getAppConfig(currentConfig: AppConfig): Promise<AppConfig> {
		const answers = await inquirer.prompt([
			{
				type: 'input',
				name: 'dirPath',
				message: '请输入要扫描的目录路径:',
				default: currentConfig.dirPath,
				validate: (input) => {
					const fullPath = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
					if (fs.existsSync(fullPath)) {
						return true;
					}
					return '请输入有效的目录路径';
				}
			},
			{
				type: 'confirm',
				name: 'upload',
				message: '是否要上传分析结果到服务器?',
				default: currentConfig.upload
			},
			{
				type: 'input',
				name: 'serverUrl',
				message: '请输入 baseUrl 服务器地址:',
				default: currentConfig.baseUrl,
				when: (answers) => answers.upload
			},
			{
				type: 'input',
				name: 'outputDir',
				message: '请输入分析结果输出目录:',
				default: currentConfig.outputDir
			},
			{
				type: 'input',
				name: 'outputJsonFile',
				message: '请输入JSON结果输出文件名:',
				default: currentConfig.outputJsonFile
			},
			{
				type: 'input',
				name: 'projectId',
				message: '请输入项目 ID (可选):',
				default: currentConfig.projectId
			}
		]);

		const dirPath = path.isAbsolute(answers.dirPath)
			? answers.dirPath
			: path.resolve(process.cwd(), answers.dirPath);

		return {
			dirPath,
			upload: answers.upload,
			baseUrl: answers.upload ? answers.serverUrl : currentConfig.baseUrl,
			outputDir: answers.outputDir,
			contextType: currentConfig.contextType,
			nonInteractive: currentConfig.nonInteractive,
			outputJsonFile: answers.outputJsonFile,
			projectId: answers.projectId
		};
	}
}
