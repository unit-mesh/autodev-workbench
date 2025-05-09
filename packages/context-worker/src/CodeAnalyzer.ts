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

// 修改接口定义以包含位置信息
export interface InterfaceImplementation {
	interfaceName: string;
	interfaceFile: string;
	methodCount: number;
	package: string;
	// 添加位置信息
	position: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	implementations: Array<{
		className: string;
		classFile: string;
		// 添加实现类的位置信息
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface MultiImplementation {
	className: string;
	classFile: string;
	// 添加类的位置信息
	position?: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	interfaceCount: number;
	interfaces: Array<{
		interfaceName: string;
		interfaceFile: string;
		// 添加接口的位置信息
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface ClassExtension {
	parentName: string;
	parentFile: string;
	package: string;
	// 添加父类的位置信息
	position: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	children: Array<{
		className: string;
		classFile: string;
		// 添加子类的位置信息
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface MultiExtension {
	className: string;
	classFile: string;
	// 添加类的位置信息
	position?: {
		start: { row: number, column: number },
		end: { row: number, column: number }
	};
	parentCount: number;
	parents: Array<{
		parentName: string;
		parentFile: string;
		// 添加父类的位置信息
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface InheritanceHierarchy {
	maxDepth: number;
	deepestClasses: Array<{
		className: string;
		classFile: string;
		// 添加类的位置信息
		position?: {
			start: { row: number, column: number },
			end: { row: number, column: number }
		};
	}>;
}

export interface CodeAnalysisResult {
	interfaceAnalysis: {
		interfaces: InterfaceImplementation[];
		multiImplementers: MultiImplementation[];
		stats: {
			totalInterfaces: number;
			implementedInterfaces: number;
			unimplementedInterfaces: number;
			multiImplementerCount: number;
		};
	};
	extensionAnalysis: {
		extensions: ClassExtension[];
		multiExtensions: MultiExtension[];
		hierarchy: InheritanceHierarchy;
		stats: {
			extendedClassCount: number;
			totalExtensionRelations: number;
			multiExtendedClassCount: number;
		};
	};
}

export class CodeAnalyzer {
	private serviceProvider: ILanguageServiceProvider;
	private structurerManager: StructurerProviderManager;
	private fileScanner: FileSystemScanner;
	private classHierarchyMap = new Map<string, { className: string, childInfo: any }[]>();

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

	public async analyzeDirectory(dirPath: string): Promise<CodeAnalysisResult> {
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

		// 修改返回分析结果而不是直接显示
		const interfaceResults = this.getImplementationResults(interfaceMap, implementationMap);
		const extensionResults = this.getExtensionResults(classMap, extensionMap);

		return {
			interfaceAnalysis: interfaceResults,
			extensionAnalysis: extensionResults
		};
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

	// 重命名并修改以返回数据结构
	private getImplementationResults(interfaceMap: Map<string, any>, implementationMap: Map<string, any[]>): {
		interfaces: InterfaceImplementation[];
		multiImplementers: MultiImplementation[];
		stats: {
			totalInterfaces: number;
			implementedInterfaces: number;
			unimplementedInterfaces: number;
			multiImplementerCount: number;
		};
	} {
		const interfaces = Array.from(interfaceMap.values());
		interfaces.sort((a, b) => {
			const packageCompare = (a.interface.package || '').localeCompare(b.interface.package || '');
			if (packageCompare !== 0) return packageCompare;
			return a.interface.name.localeCompare(b.interface.name);
		});

		let implementedCount = 0;
		const interfaceResults: InterfaceImplementation[] = [];
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

			const methodCount = intf.methods ? intf.methods.length : 0;

			// 创建接口实现结果对象
			const interfaceResult: InterfaceImplementation = {
				interfaceName: intf.name,
				interfaceFile: item.file,
				methodCount: methodCount,
				package: intf.package || '',
				// 添加接口位置信息
				position: {
					start: intf.start,
					end: intf.end
				},
				implementations: []
			};

			if (uniqueImplementations.length > 0) {
				implementedCount++;
				interfaceResult.implementations = uniqueImplementations.map(impl => ({
					className: impl.className,
					classFile: impl.classFile,
					// 添加实现类位置信息
					position: impl.class ? {
						start: impl.class.start,
						end: impl.class.end
					} : undefined
				}));
			}

			interfaceResults.push(interfaceResult);
		});

		// 分析多接口实现情况
		const multiImplementers: MultiImplementation[] = [];

		// 将类按实现的接口数量排序
		const sortedClasses = Array.from(classToInterfacesMap.entries())
			.filter(([_, interfaces]) => interfaces.size > 1)
			.sort((a, b) => b[1].size - a[1].size);

		sortedClasses.forEach(([classKey, interfaceSet]) => {
			if (interfaceSet.size > 1) {
				const [className, classFile] = classKey.split(':');

				// 查找类对象以获取位置信息
				const classObj = Array.from(classMap.values())
					.find(item => item.class.name === className || 
						   (item.class.canonicalName && item.class.canonicalName === className));

				// 创建多接口实现结果对象
				const multiImplementer: MultiImplementation = {
					className: className,
					classFile: classFile,
					// 添加类的位置信息
					position: classObj ? {
						start: classObj.class.start,
						end: classObj.class.end
					} : undefined,
					interfaceCount: interfaceSet.size,
					interfaces: []
				};

				// 添加接口信息
				Array.from(interfaceSet).forEach(interfaceKey => {
					const interfaceInfo = interfaceMap.get(interfaceKey);
					if (interfaceInfo) {
						multiImplementer.interfaces.push({
							interfaceName: interfaceInfo.interface.name,
							interfaceFile: interfaceInfo.file,
							// 添加接口位置信息
							position: {
								start: interfaceInfo.interface.start,
								end: interfaceInfo.interface.end
							}
						});
					}
				});

				multiImplementers.push(multiImplementer);
			}
		});

		return {
			interfaces: interfaceResults,
			multiImplementers: multiImplementers,
			stats: {
				totalInterfaces: interfaces.length,
				implementedInterfaces: implementedCount,
				unimplementedInterfaces: interfaces.length - implementedCount,
				multiImplementerCount: multiImplementers.length
			}
		};
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

	// 重命名并修改以返回数据结构
	private getExtensionResults(classMap: Map<string, any>, extensionMap: Map<string, any[]>): {
		extensions: ClassExtension[];
		multiExtensions: MultiExtension[];
		hierarchy: InheritanceHierarchy;
		stats: {
			extendedClassCount: number;
			totalExtensionRelations: number;
			multiExtendedClassCount: number;
		};
	} {
		const classes = Array.from(classMap.values());
		classes.sort((a, b) => {
			const packageCompare = (a.class.package || '').localeCompare(b.class.package || '');
			if (packageCompare !== 0) return packageCompare;
			return a.class.name.localeCompare(b.class.name);
		});

		let extendedCount = 0;
		const extensionResults: ClassExtension[] = [];
		// 记录每个类继承的父类数量，用于分析多重继承
		const classToParentsMap = new Map<string, Set<string>>();
		// 记录继承层次结构
		this.classHierarchyMap.clear();

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

				// 记录继承层次 - 改进存储格式，保存完整的子类信息
				if (!this.classHierarchyMap.has(classKey)) {
					this.classHierarchyMap.set(classKey, []);
				}
				this.classHierarchyMap.get(classKey)!.push({
					className: child.className,
					childInfo: child
				});
			});

			// 只处理被继承的类
			if (uniqueChildClasses.length === 0) continue;

			extendedCount++;

			// 创建类继承结果对象
			const extensionResult: ClassExtension = {
				parentName: cls.name,
				parentFile: item.file,
				package: cls.package || '',
				// 添加父类位置信息
				position: {
					start: cls.start,
					end: cls.end
				},
				children: uniqueChildClasses.map(child => ({
					className: child.className,
					classFile: child.classFile,
					// 添加子类位置信息
					position: child.class ? {
						start: child.class.start,
						end: child.class.end
					} : undefined
				}))
			};

			extensionResults.push(extensionResult);
		}

		// 分析多重继承情况
		const multiExtensions: MultiExtension[] = [];

		// 将类按继承的父类数量排序
		const sortedClasses = Array.from(classToParentsMap.entries())
			.filter(([_, parents]) => parents.size > 1)
			.sort((a, b) => b[1].size - a[1].size);

		sortedClasses.forEach(([classKey, parents]) => {
			if (parents.size > 1) {
				const [className, classFile] = classKey.split(':');

				// 查找类对象以获取位置信息
				const classObj = Array.from(classMap.values())
					.find(item => item.class.name === className || 
						   (item.class.canonicalName && item.class.canonicalName === className));

				// 创建多重继承结果对象
				const multiExtension: MultiExtension = {
					className: className,
					classFile: classFile,
					// 添加类的位置信息
					position: classObj ? {
						start: classObj.class.start,
						end: classObj.class.end
					} : undefined,
					parentCount: parents.size,
					parents: []
				};

				// 添加父类信息，包括位置
				Array.from(parents).forEach(parentKey => {
					const parentInfo = classMap.get(parentKey);
					if (parentInfo) {
						multiExtension.parents.push({
							parentName: parentInfo.class.name,
							parentFile: parentInfo.file,
							// 添加父类位置信息
							position: {
								start: parentInfo.class.start,
								end: parentInfo.class.end
							}
						});
					}
				});

				multiExtensions.push(multiExtension);
			}
		});

		// 分析继承层次
		const hierarchyResult = this.analyzeInheritanceHierarchyData(this.classHierarchyMap, classMap);

		return {
			extensions: extensionResults,
			multiExtensions: multiExtensions,
			hierarchy: hierarchyResult,
			stats: {
				extendedClassCount: extendedCount,
				totalExtensionRelations: Array.from(extensionMap.values())
					.map(children => this.deduplicateImplementations(children).length)
					.reduce((sum, count) => sum + count, 0),
				multiExtendedClassCount: multiExtensions.length
			}
		};
	}

	// 修改为返回数据的版本
	private analyzeInheritanceHierarchyData(hierarchyMap: Map<string, { className: string, childInfo: any }[]>, classMap: Map<string, any>): InheritanceHierarchy {
		// 查找根类（没有父类的类）
		const allClasses = new Set<string>();
		const allChildClasses = new Set<string>();

		// 收集所有类和子类
		for (const [parentClass, childInfoArray] of hierarchyMap.entries()) {
			allClasses.add(parentClass);
			childInfoArray.forEach(child => {
				allClasses.add(child.className);
				allChildClasses.add(child.className);
			});
		}

		// 找出根类（不是任何类的子类）
		const rootClasses = Array.from(allClasses).filter(cls => !allChildClasses.has(cls));

		// 对于每个根类，计算最大继承深度
		const classDepths = new Map<string, { depth: number, childInfo?: any }>();
		for (const rootClass of rootClasses) {
			this.calculateInheritanceDepthWithInfo(rootClass, hierarchyMap, classDepths, 0);
		}

		// 找出最大深度和相应的类
		const result: InheritanceHierarchy = {
			maxDepth: 0,
			deepestClasses: []
		};

		if (classDepths.size > 0) {
			const maxDepth = Math.max(...Array.from(classDepths.values()).map(info => info.depth));
			const classesWithMaxDepth = Array.from(classDepths.entries())
				.filter(([_, info]) => info.depth === maxDepth);

			result.maxDepth = maxDepth;

			classesWithMaxDepth.forEach(([className, info]) => {
				// 1. 首先尝试从子类信息中获取文件路径
				if (info.childInfo && info.childInfo.classFile) {
					result.deepestClasses.push({
						className: className.includes('.') ? className.split('.').pop()! : className,
						classFile: info.childInfo.classFile,
						position: info.childInfo.class ? {
							start: info.childInfo.class.start,
							end: info.childInfo.class.end
						} : undefined
					});
					return;
				}
				
				// 2. 尝试从classMap中查找类信息 - 使用多种匹配策略
				const classInfo = this.findClassInfoByName(className, classMap);
				
				if (classInfo) {
					result.deepestClasses.push({
						className: classInfo.class.name,
						classFile: classInfo.file,
						position: {
							start: classInfo.class.start,
							end: classInfo.class.end
						}
					});
				} else {
					// 3. 如果都找不到，尝试提取包名和类名
					const parts = className.split('.');
					const simpleName = parts.length > 0 ? parts[parts.length - 1] : className;
					
					result.deepestClasses.push({
						className: simpleName,
						classFile: this.tryFindClassFile(simpleName, classMap) || ''
					});
				}
			});
		}

		return result;
	}

	// 改进的递归计算继承深度，保存子类信息
	private calculateInheritanceDepthWithInfo(
		className: string,
		hierarchyMap: Map<string, { className: string, childInfo: any }[]>,
		depthMap: Map<string, { depth: number, childInfo?: any }>,
		currentDepth: number
	): number {
		// 如果已经计算过这个类的深度，直接返回
		if (depthMap.has(className)) {
			return depthMap.get(className)!.depth;
		}

		const children = hierarchyMap.get(className) || [];
		if (children.length === 0) {
			// 叶子节点
			depthMap.set(className, { depth: currentDepth });
			return currentDepth;
		}

		// 递归计算所有子类的深度，并返回最大值
		let maxChildDepth = currentDepth;
		let childWithMaxDepth;
		
		for (const child of children) {
			const childDepth = this.calculateInheritanceDepthWithInfo(
				child.className, 
				hierarchyMap, 
				depthMap, 
				currentDepth + 1
			);
			
			if (childDepth > maxChildDepth) {
				maxChildDepth = childDepth;
				childWithMaxDepth = child.childInfo;
			}
		}

		depthMap.set(className, { 
			depth: maxChildDepth,
			childInfo: childWithMaxDepth
		});
		return maxChildDepth;
	}
	
	// 辅助方法：通过类名查找类信息
	private findClassInfoByName(className: string, classMap: Map<string, any>): any {
		// 直接使用类名作为键查找
		if (classMap.has(className)) {
			return classMap.get(className);
		}
		
		// 尝试提取简单类名并查找
		const simpleName = className.includes('.') ? className.split('.').pop()! : className;
		
		// 查找类名匹配的所有类
		for (const [key, value] of classMap.entries()) {
			// 检查类名完全匹配
			if (value.class.name === simpleName) {
				return value;
			}
			
			// 检查规范名称匹配
			if (value.class.canonicalName === className) {
				return value;
			}
			
			// 检查键是否以类名结尾
			if (key.endsWith(`.${simpleName}`)) {
				return value;
			}
		}
		
		return null;
	}
	
	// 辅助方法：尝试查找类文件
	private tryFindClassFile(className: string, classMap: Map<string, any>): string | null {
		for (const [_, value] of classMap.entries()) {
			if (value.class.name === className) {
				return value.file;
			}
		}
		return null;
	}
}
