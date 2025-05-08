import { InstantiationService, providerContainer } from "./base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "./base/common/languages/languageService";
import { StructurerProviderManager } from "./code-context/StructurerProviderManager";
import { IStructurerProvider } from "./ProviderTypes";
import { JavaStructurerProvider } from "./code-context/java/JavaStructurerProvider";
import { TypeScriptStructurer } from "./code-context/typescript/TypeScriptStructurer";
import { GoStructurerProvider } from "./code-context/go/GoStructurerProvider";
import { StructureType } from "./codemodel/CodeElement";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const instantiationService = new InstantiationService();
instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider)

providerContainer.bind(IStructurerProvider).to(JavaStructurerProvider);
providerContainer.bind(IStructurerProvider).to(TypeScriptStructurer);
providerContainer.bind(IStructurerProvider).to(GoStructurerProvider);

// 获取文件扩展名对应的语言
function getLanguageFromExt(ext: string): string | null {
	switch (ext.toLowerCase()) {
		case '.java':
			return 'java';
		case '.ts':
		case '.js':
		case '.tsx':
			return 'typescript';
		case '.go':
			return 'go';
		default:
			return null;
	}
}

async function scanDirectory(dirPath: string): Promise<string[]> {
	const entries = await readdir(dirPath, { withFileTypes: true });
	const files = await Promise.all(entries.map(async (entry) => {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			return scanDirectory(fullPath);
		} else {
			return [fullPath];
		}
	}));
	return files.flat();
}

// 解析命令行参数
function parseArgs(): { dirPath: string } {
	const args = process.argv.slice(2);
	let dirPath = process.cwd(); // 默认为当前目录

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--path' || args[i] === '-p') {
			if (i + 1 < args.length) {
				dirPath = args[i + 1];
				// 转换为绝对路径
				if (!path.isAbsolute(dirPath)) {
					dirPath = path.resolve(process.cwd(), dirPath);
				}
				i++; // 跳过下一个参数
			}
		}
	}

	return { dirPath };
}

async function main(dirPath?: string) {
	const serviceProvider = instantiationService.get(ILanguageServiceProvider);
	await serviceProvider.ready()
	console.log("Language service is ready");

	const structurerManager = StructurerProviderManager.getInstance();

	// 使用提供的路径或者命令行参数中的路径
	const targetDir = dirPath || parseArgs().dirPath;
	console.log(`正在扫描目录: ${targetDir}`);

	const files = await scanDirectory(targetDir);

	// 使用Map存储接口，按canonicalName去重
	const interfaceMap = new Map();
	let totalProcessed = 0;

	for (const file of files) {
		const ext = path.extname(file);
		const language = getLanguageFromExt(ext);

		if (!language) continue;

		try {
			const content = await readFile(file, 'utf-8');
			const structurer = structurerManager.getStructurer(language);
			await structurer.init(serviceProvider);
			const codeFile = await structurer.parseFile(content, file);
			totalProcessed++;

			if (codeFile.classes) {
				const fileInterfaces = codeFile.classes.filter(cls => cls.type === StructureType.Interface);
				for (const intf of fileInterfaces) {
					// 使用canonicalName作为唯一标识，如果没有则使用包名+接口名
					const key = intf.canonicalName || `${intf.package}.${intf.name}`;

					// 如果接口已存在，且新接口的方法更多，则替换
					if (!interfaceMap.has(key) ||
					    (intf.methods && interfaceMap.get(key).interface.methods &&
						 intf.methods.length > interfaceMap.get(key).interface.methods.length)) {
						interfaceMap.set(key, {
							file: file,
							interface: intf
						});
					}
				}
			}
		} catch (error) {
			console.error(`处理文件 ${file} 时出错:`, error);
		}
	}

	const uniqueInterfaces = Array.from(interfaceMap.values());

	// 按包名和接口名排序
	uniqueInterfaces.sort((a, b) => {
		const packageCompare = (a.interface.package || '').localeCompare(b.interface.package || '');
		if (packageCompare !== 0) return packageCompare;
		return a.interface.name.localeCompare(b.interface.name);
	});

	let currentPackage = '';
	uniqueInterfaces.forEach(item => {
		const intf = item.interface;
		if (intf.package !== currentPackage) {
			currentPackage = intf.package || '';
			console.log(`\n包: ${currentPackage || '(默认包)'}`);
		}

		const methodCount = intf.methods ? intf.methods.length : 0;
		console.log(`- ${intf.name} (${methodCount} 个方法, 位于 ${item.file})`);
	});

	// 统计信息
	console.log(`\n接口统计:`);
	console.log(`- 总接口数: ${uniqueInterfaces.length}`);
	console.log(`- 总方法数: ${uniqueInterfaces.reduce((sum, item) => 
		sum + (item.interface.methods ? item.interface.methods.length : 0), 0)}`);
}

// 允许通过命令行或程序内调用
if (require.main === module) {
	// 直接运行脚本时执行
	main().then(r => {
	}).catch(err => console.error("错误:", err));
} else {
	// 作为模块导入时，导出 main 函数
	module.exports = { main };
}

