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

async function main() {
	const serviceProvider = instantiationService.get(ILanguageServiceProvider);
	await serviceProvider.ready()
	console.log("Language service is ready");

	const structurerManager = StructurerProviderManager.getInstance();
	const currentDir = process.cwd();
	console.log(`正在扫描目录: ${currentDir}`);

	const files = await scanDirectory(currentDir);
	const interfaces = [];

	for (const file of files) {
		const ext = path.extname(file);
		const language = getLanguageFromExt(ext);

		if (!language) continue;

		try {
			const content = await readFile(file, 'utf-8');
			const structurer = structurerManager.getStructurer(language);
			await structurer.init(serviceProvider);
			const codeFile = await structurer.parseFile(content, file);

			if (codeFile.classes) {
				const fileInterfaces = codeFile.classes.filter(cls => cls.type === StructureType.Interface);
				if (fileInterfaces.length > 0) {
					interfaces.push(...fileInterfaces.map(intf => ({
						file: file,
						interface: intf
					})));
				}
			}
		} catch (error) {
			console.error(`处理文件 ${file} 时出错:`, error);
		}
	}

	console.log(`找到 ${interfaces.length} 个接口:`);
	interfaces.forEach(intf => {
		console.log(`- ${intf.interface.name} (位于 ${intf.file})`);
	});
}

main().then(r => {
}).catch(err => console.error("错误:", err));

