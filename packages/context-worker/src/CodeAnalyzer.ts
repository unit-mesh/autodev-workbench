import { ILanguageServiceProvider } from "./base/common/languages/languageService";
import { StructurerProviderManager } from "./code-context/StructurerProviderManager";
import { InstantiationService } from "./base/common/instantiation/instantiationService";
import path from "path";
import { CodeStructure, StructureType } from "./codemodel/CodeElement";
import { promisify } from "util";
import fs from "fs";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

/**
 * Handles file system operations for scanning directories and files
 */
class FileSystemScanner {
	public async scanDirectory(dirPath: string): Promise<string[]> {
		const entries = await readdir(dirPath, { withFileTypes: true });
		const files = await Promise.all(entries.map(async (entry) => {
			const fullPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				return this.scanDirectory(fullPath);
			} else {
				return [fullPath];
			}
		}));

		return files.flat();
	}

	public async readFileContent(filePath: string): Promise<string> {
		return readFile(filePath, 'utf-8');
	}
}

export class CodeAnalyzer {
	private serviceProvider: ILanguageServiceProvider;
	private structurerManager: StructurerProviderManager;
	private fileScanner: FileSystemScanner;

	constructor(instantiationService: InstantiationService) {
		this.serviceProvider = instantiationService.get(ILanguageServiceProvider);
		this.structurerManager = StructurerProviderManager.getInstance();
		this.fileScanner = new FileSystemScanner();
	}

	public async initialize(): Promise<void> {
		await this.serviceProvider.ready();
	}

	public getLanguageFromExt(ext: string): string | null {
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

	public async analyzeDirectory(dirPath: string): Promise<void> {
		const files = await this.fileScanner.scanDirectory(dirPath);
		const interfaceMap = new Map();
		const classMap = new Map();
		const implementationMap = new Map();
		let totalProcessed = 0;

		// First pass: collect all interfaces and classes
		for (const file of files) {
			const ext = path.extname(file);
			const language = this.getLanguageFromExt(ext);

			if (!language) continue;

			try {
				const content = await this.fileScanner.readFileContent(file);
				const structurer = this.structurerManager.getStructurer(language);
				await structurer.init(this.serviceProvider);
				const codeFile = await structurer.parseFile(content, file);
				totalProcessed++;

				if (codeFile.classes) {
					// Collect interfaces
					const fileInterfaces: CodeStructure[] = codeFile.classes.filter(cls => cls.type === StructureType.Interface);
					for (const intf of fileInterfaces) {
						const key = intf.canonicalName || `${intf.package}.${intf.name}`;
						if (!interfaceMap.has(key) ||
							(intf.methods && interfaceMap.get(key).interface.methods &&
								intf.methods.length > interfaceMap.get(key).interface.methods.length)) {
							interfaceMap.set(key, {
								file: file,
								interface: intf
							});
						}
					}

					// Collect classes
					const fileClasses = codeFile.classes.filter(cls => cls.type === StructureType.Class);
					for (const cls of fileClasses) {
						const key = cls.canonicalName || `${cls.package}.${cls.name}`;
						classMap.set(key, {
							file: file,
							class: cls
						});
					}
				}
			} catch (error) {
				console.error(`处理文件 ${file} 时出错:`, error);
			}
		}

		// Second pass: find interfaces that are implemented by classes
		for (const [className, classInfo] of classMap) {
			const cls = classInfo.class;
			if (cls.implements && cls.implements.length > 0) {
				for (const interfaceName of cls.implements) {
					// Try different ways to match the interface
					const interfaceKey = this.findInterfaceKey(interfaceName, cls.package, interfaceMap);

					if (interfaceKey && interfaceMap.has(interfaceKey)) {
						if (!implementationMap.has(interfaceKey)) {
							implementationMap.set(interfaceKey, []);
						}
						implementationMap.get(interfaceKey).push({
							className: className,
							classFile: classInfo.file,
							class: cls
						});
					}
				}
			}
		}

		this.displayImplementationResults(interfaceMap, implementationMap);
	}

	private findInterfaceKey(interfaceName: string, classPackage: string, interfaceMap: Map<string, any>): string | null {
		// Try with full name if it's already fully qualified
		if (interfaceMap.has(interfaceName)) {
			return interfaceName;
		}

		// Try with class's package + interface name
		const packagedName = `${classPackage}.${interfaceName}`;
		if (interfaceMap.has(packagedName)) {
			return packagedName;
		}

		// Try to find by short name match
		for (const [key, value] of interfaceMap.entries()) {
			if (key.endsWith(`.${interfaceName}`) || value.interface.name === interfaceName) {
				return key;
			}
		}

		return null;
	}

	private displayImplementationResults(interfaceMap: Map<string, any>, implementationMap: Map<string, any[]>): void {
		console.log(`\n接口实现关系分析:`);

		const interfaces = Array.from(interfaceMap.values());
		interfaces.sort((a, b) => {
			const packageCompare = (a.interface.package || '').localeCompare(b.interface.package || '');
			if (packageCompare !== 0) return packageCompare;
			return a.interface.name.localeCompare(b.interface.name);
		});

		let currentPackage = '';
		let implementedCount = 0;

		interfaces.forEach((item: any) => {
			const intf = item.interface;
			const interfaceKey = intf.canonicalName || `${intf.package}.${intf.name}`;
			const implementations = implementationMap.get(interfaceKey) || [];

			if (intf.package !== currentPackage) {
				currentPackage = intf.package || '';
				console.log(`\n包: ${currentPackage || '(默认包)'}`);
			}

			const methodCount = intf.methods ? intf.methods.length : 0;
			console.log(`- 接口: ${intf.name} (${methodCount} 个方法, 位于 ${item.file})`);

			if (implementations.length > 0) {
				implementedCount++;
				console.log(`  实现类 (${implementations.length}):`);
				implementations.forEach(impl => {
					console.log(`  - ${impl.className} (位于 ${impl.classFile})`);
				});
			} else {
				console.log(`  无实现类`);
			}
		});

		console.log(`\n统计信息:`);
		console.log(`- 总接口数: ${interfaces.length}`);
		console.log(`- 有实现的接口数: ${implementedCount}`);
		console.log(`- 无实现的接口数: ${interfaces.length - implementedCount}`);
	}

	private displayResults(interfaceMap: Map<string, any>): void {
		const uniqueInterfaces = Array.from(interfaceMap.values());

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

		console.log(`\n接口统计:`);
		console.log(`- 总接口数: ${uniqueInterfaces.length}`);
		console.log(`- 总方法数: ${uniqueInterfaces.reduce((sum, item) =>
			sum + (item.interface.methods ? item.interface.methods.length : 0), 0)}`);
	}
}
