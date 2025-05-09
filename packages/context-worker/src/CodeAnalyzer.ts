import { ILanguageServiceProvider } from "./base/common/languages/languageService";
import { StructurerProviderManager } from "./code-context/StructurerProviderManager";
import { InstantiationService } from "./base/common/instantiation/instantiationService";
import path from "path";
import { CodeFile, CodeStructure, StructureType } from "./codemodel/CodeElement";
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
		const extensionMap = new Map(); // 新增：保存继承关系
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
				const codeFile: CodeFile = await structurer.parseFile(content, file);
				console.log(codeFile)
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

		// Second pass: find interfaces that are implemented by classes and classes that are extended
		for (const [className, classInfo] of classMap) {
			const cls = classInfo.class;
			
			// 处理接口实现关系
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
			
			// 处理类继承关系
			if (cls.extends && cls.extends.length > 0) {
				for (const parentClassName of cls.extends) {
					// 尝试不同方式匹配父类
					const parentClassKey = this.findClassKey(parentClassName, cls.package, classMap);
					
					if (parentClassKey && classMap.has(parentClassKey)) {
						if (!extensionMap.has(parentClassKey)) {
							extensionMap.set(parentClassKey, []);
						}
						extensionMap.get(parentClassKey).push({
							className: className,
							classFile: classInfo.file,
							class: cls
						});
					}
				}
			}
		}

		this.displayImplementationResults(interfaceMap, implementationMap);
		this.displayExtensionResults(classMap, extensionMap); // 新增：显示继承关系
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
	
	// 新增：查找父类的方法
	private findClassKey(parentClassName: string, classPackage: string, classMap: Map<string, any>): string | null {
		// 尝试直接使用全名查找
		if (classMap.has(parentClassName)) {
			return parentClassName;
		}

		// 尝试使用类的包名 + 父类名查找
		const packagedName = `${classPackage}.${parentClassName}`;
		if (classMap.has(packagedName)) {
			return packagedName;
		}

		// 尝试通过短名匹配查找
		for (const [key, value] of classMap.entries()) {
			if (key.endsWith(`.${parentClassName}`) || value.class.name === parentClassName) {
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
		// 记录每个类实现的接口数量，用于分析多接口实现
		const classToInterfacesMap = new Map<string, Set<string>>();

		interfaces.forEach((item: any) => {
			const intf = item.interface;
			const interfaceKey = intf.canonicalName || `${intf.package}.${intf.name}`;
			const implementations = implementationMap.get(interfaceKey) || [];
			
			// 对实现类进行去重处理
			const uniqueImplementations = this.deduplicateImplementations(implementations);

			// 记录实现关系
			uniqueImplementations.forEach(impl => {
				const classKey = `${impl.className}:${impl.classFile}`;
				if (!classToInterfacesMap.has(classKey)) {
					classToInterfacesMap.set(classKey, new Set());
				}
				classToInterfacesMap.get(classKey)!.add(interfaceKey);
			});

			if (intf.package !== currentPackage) {
				currentPackage = intf.package || '';
				console.log(`\n包: ${currentPackage || '(默认包)'}`);
			}

			const methodCount = intf.methods ? intf.methods.length : 0;
			console.log(`- 接口: ${intf.name} (${methodCount} 个方法, 位于 ${item.file})`);

			if (uniqueImplementations.length > 0) {
				implementedCount++;
				console.log(`  实现类 (${uniqueImplementations.length}):`);
				uniqueImplementations.forEach(impl => {
					console.log(`  - ${impl.className} (位于 ${impl.classFile})`);
				});
			} else {
				console.log(`  无实现类`);
			}
		});

		// 显示多接口实现情况
		console.log(`\n多接口实现分析:`);
		let multiImplCount = 0;
		
		// 将类按实现的接口数量排序
		const sortedClasses = Array.from(classToInterfacesMap.entries())
			.filter(([_, interfaces]) => interfaces.size > 1)
			.sort((a, b) => b[1].size - a[1].size);
		
		sortedClasses.forEach(([classKey, interfaces]) => {
			if (interfaces.size > 1) {
				multiImplCount++;
				const [className, classFile] = classKey.split(':');
				console.log(`- 类: ${className} (位于 ${classFile}) 实现了 ${interfaces.size} 个接口:`);
				
				// 显示该类实现的所有接口
				Array.from(interfaces).forEach(interfaceKey => {
					const interfaceInfo = interfaceMap.get(interfaceKey);
					if (interfaceInfo) {
						console.log(`  - ${interfaceInfo.interface.name} (位于 ${interfaceInfo.file})`);
					}
				});
			}
		});

		console.log(`\n统计信息:`);
		console.log(`- 总接口数: ${interfaces.length}`);
		console.log(`- 有实现的接口数: ${implementedCount}`);
		console.log(`- 无实现的接口数: ${interfaces.length - implementedCount}`);
		console.log(`- 实现多个接口的类数: ${multiImplCount}`);
	}
	
	// 辅助方法：去除重复的实现类
	private deduplicateImplementations(implementations: any[]): any[] {
		const uniqueMap = new Map<string, any>();
		
		for (const impl of implementations) {
			// 使用实现类名和文件路径的组合作为唯一标识
			const key = `${impl.className}:${impl.classFile}`;
			
			if (!uniqueMap.has(key)) {
				uniqueMap.set(key, impl);
			}
		}
		
		return Array.from(uniqueMap.values());
	}
	
	// 同样为 displayExtensionResults 方法也添加去重逻辑
	private displayExtensionResults(classMap: Map<string, any>, extensionMap: Map<string, any[]>): void {
		console.log(`\n类继承关系分析:`);

		const classes = Array.from(classMap.values());
		classes.sort((a, b) => {
			const packageCompare = (a.class.package || '').localeCompare(b.class.package || '');
			if (packageCompare !== 0) return packageCompare;
			return a.class.name.localeCompare(b.class.name);
		});

		let currentPackage = '';
		let extendedCount = 0;
		// 记录每个类继承的父类数量，用于分析多重继承
		const classToParentsMap = new Map<string, Set<string>>();
		// 记录继承层次结构
		const classHierarchyMap = new Map<string, string[]>();

		for (const item of classes) {
			const cls = item.class;
			const classKey = cls.canonicalName || `${cls.package}.${cls.name}`;
			const childClasses = extensionMap.get(classKey) || [];
			
			// 对子类进行去重处理
			const uniqueChildClasses = this.deduplicateImplementations(childClasses);

			// 记录继承关系
			uniqueChildClasses.forEach(child => {
				const childKey = `${child.className}:${child.classFile}`;
				if (!classToParentsMap.has(childKey)) {
					classToParentsMap.set(childKey, new Set());
				}
				classToParentsMap.get(childKey)!.add(classKey);
				
				// 记录继承层次
				if (!classHierarchyMap.has(classKey)) {
					classHierarchyMap.set(classKey, []);
				}
				classHierarchyMap.get(classKey)!.push(child.className);
			});

			// 只显示被继承的类
			if (uniqueChildClasses.length === 0) continue;

			if (cls.package !== currentPackage) {
				currentPackage = cls.package || '';
				console.log(`\n包: ${currentPackage || '(默认包)'}`);
			}

			extendedCount++;
			console.log(`- 父类: ${cls.name} (位于 ${item.file})`);
			console.log(`  子类 (${uniqueChildClasses.length}):`);
			
			uniqueChildClasses.forEach(child => {
				console.log(`  - ${child.className} (位于 ${child.classFile})`);
			});
		}

		// 显示多重继承情况（如果有的话）
		console.log(`\n多重继承分析:`);
		let multiExtendCount = 0;
		
		// 将类按继承的父类数量排序
		const sortedClasses = Array.from(classToParentsMap.entries())
			.filter(([_, parents]) => parents.size > 1)
			.sort((a, b) => b[1].size - a[1].size);
		
		sortedClasses.forEach(([classKey, parents]) => {
			if (parents.size > 1) {
				multiExtendCount++;
				const [className, classFile] = classKey.split(':');
				console.log(`- 类: ${className} (位于 ${classFile}) 继承自 ${parents.size} 个父类:`);
				
				// 显示该类的所有父类
				Array.from(parents).forEach(parentKey => {
					const parentInfo = classMap.get(parentKey);
					if (parentInfo) {
						console.log(`  - ${parentInfo.class.name} (位于 ${parentInfo.file})`);
					}
				});
			}
		});

		// 显示继承层次最深的类
		if (classHierarchyMap.size > 0) {
			console.log(`\n继承层次分析:`);
			this.analyzeInheritanceHierarchy(classHierarchyMap, classMap);
		}

		console.log(`\n继承统计信息:`);
		console.log(`- 被继承的类数: ${extendedCount}`);
		console.log(`- 继承关系总数: ${Array.from(extensionMap.values())
			.map(children => this.deduplicateImplementations(children).length)
			.reduce((sum, count) => sum + count, 0)}`);
		console.log(`- 多重继承的类数: ${multiExtendCount}`);
	}
	
	// 分析并显示继承层次结构
	private analyzeInheritanceHierarchy(hierarchyMap: Map<string, string[]>, classMap: Map<string, any>): void {
		// 查找根类（没有父类的类）
		const allClasses = new Set<string>();
		const allChildClasses = new Set<string>();
		
		// 收集所有类和子类
		for (const [parentClass, childClasses] of hierarchyMap.entries()) {
			allClasses.add(parentClass);
			childClasses.forEach(child => {
				allClasses.add(child);
				allChildClasses.add(child);
			});
		}
		
		// 找出根类（不是任何类的子类）
		const rootClasses = Array.from(allClasses).filter(cls => !allChildClasses.has(cls));
		
		// 对于每个根类，计算最大继承深度
		const classDepths = new Map<string, number>();
		for (const rootClass of rootClasses) {
			this.calculateInheritanceDepth(rootClass, hierarchyMap, classDepths, 0);
		}
		
		// 找出最大深度并显示
		if (classDepths.size > 0) {
			const maxDepth = Math.max(...Array.from(classDepths.values()));
			const classesWithMaxDepth = Array.from(classDepths.entries())
				.filter(([_, depth]) => depth === maxDepth)
				.map(([className, _]) => className);
			
			console.log(`- 最大继承深度: ${maxDepth}`);
			console.log(`- 继承层次最深的类:`);
			classesWithMaxDepth.forEach(className => {
				const classInfo = Array.from(classMap.values())
					.find(info => info.class.name === className || info.class.canonicalName === className);
				if (classInfo) {
					console.log(`  - ${classInfo.class.name} (位于 ${classInfo.file})`);
				} else {
					console.log(`  - ${className}`);
				}
			});
		}
	}
	
	// 递归计算继承深度
	private calculateInheritanceDepth(
		className: string, 
		hierarchyMap: Map<string, string[]>, 
		depthMap: Map<string, number>, 
		currentDepth: number
	): number {
		// 如果已经计算过这个类的深度，直接返回
		if (depthMap.has(className)) {
			return depthMap.get(className)!;
		}
		
		const children = hierarchyMap.get(className) || [];
		if (children.length === 0) {
			// 叶子节点
			depthMap.set(className, currentDepth);
			return currentDepth;
		}
		
		// 递归计算所有子类的深度，并返回最大值
		let maxChildDepth = currentDepth;
		for (const child of children) {
			const childDepth = this.calculateInheritanceDepth(child, hierarchyMap, depthMap, currentDepth + 1);
			maxChildDepth = Math.max(maxChildDepth, childDepth);
		}
		
		depthMap.set(className, maxChildDepth);
		return maxChildDepth;
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
