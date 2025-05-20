import { inferLanguage } from "../base/common/languages/languages";
import { CodeFile, CodeStructure, StructureType } from "../codemodel/CodeElement";

export class CodeCollector {
	private interfaceMap = new Map<string, { file: string, interface: CodeStructure }>();
	private classMap = new Map<string, { file: string, class: CodeStructure }>();
	private implementationMap = new Map<string, any[]>();
	private extensionMap = new Map<string, any[]>();
	private allFiles: string[] = [];
	private workspacePath: string;

	constructor(workspacePath: string) {
		this.allFiles = [];
		this.workspacePath = workspacePath;
	}

	public inferLanguage(filePath: string): string | null {
		return inferLanguage(filePath);
	}

	public getWorkspacePath(): string {
		return this.workspacePath;
	}

	public addCodeFile(filePath: string, codeFile: CodeFile): void {
		if (!codeFile.classes) return;

		const fileInterfaces: CodeStructure[] = codeFile.classes.filter(cls => cls.type === StructureType.Interface);
		for (const intf of fileInterfaces) {
			const key = intf.canonicalName || `${intf.package}.${intf.name}`;
			if (!this.interfaceMap.has(key) ||
				(intf.methods && this.interfaceMap.get(key)!.interface.methods &&
					intf.methods.length > this.interfaceMap.get(key)!.interface.methods.length)) {
				this.interfaceMap.set(key, {
					file: filePath,
					interface: intf
				});
			}
		}

		const fileClasses = codeFile.classes.filter(cls => cls.type === StructureType.Class);
		for (const cls of fileClasses) {
			const key = cls.canonicalName || `${cls.package}.${cls.name}`;
			this.classMap.set(key, {
				file: filePath,
				class: cls
			});
		}

		this.processClassRelationships();
	}

	private processClassRelationships(): void {
		this.implementationMap.clear();
		this.extensionMap.clear();

		for (const [className, classInfo] of this.classMap) {
			const cls = classInfo.class;

			if (cls.implements && cls.implements.length > 0) {
				for (const interfaceName of cls.implements) {
					const interfaceKey = this.findInterfaceKey(interfaceName, cls.package);

					if (interfaceKey && this.interfaceMap.has(interfaceKey)) {
						if (!this.implementationMap.has(interfaceKey)) {
							this.implementationMap.set(interfaceKey, []);
						}
						this.implementationMap.get(interfaceKey)!.push({
							className: className,
							classFile: classInfo.file,
							class: cls
						});
					}
				}
			}

			if (cls.extends && cls.extends.length > 0) {
				for (const parentClassName of cls.extends) {
					const parentClassKey = this.findClassKey(parentClassName, cls.package);

					if (parentClassKey && this.classMap.has(parentClassKey)) {
						if (!this.extensionMap.has(parentClassKey)) {
							this.extensionMap.set(parentClassKey, []);
						}
						this.extensionMap.get(parentClassKey)!.push({
							className: className,
							classFile: classInfo.file,
							class: cls
						});
					}
				}
			}
		}
	}

	private findInterfaceKey(interfaceName: string, classPackage: string): string | null {
		if (this.interfaceMap.has(interfaceName)) {
			return interfaceName;
		}

		const packagedName = `${classPackage}.${interfaceName}`;
		if (this.interfaceMap.has(packagedName)) {
			return packagedName;
		}

		for (const [key, value] of this.interfaceMap.entries()) {
			if (key.endsWith(`.${interfaceName}`) || value.interface.name === interfaceName) {
				return key;
			}
		}

		return null;
	}

	private findClassKey(parentClassName: string, classPackage: string): string | null {
		if (this.classMap.has(parentClassName)) {
			return parentClassName;
		}

		const packagedName = `${classPackage}.${parentClassName}`;
		if (this.classMap.has(packagedName)) {
			return packagedName;
		}

		for (const [key, value] of this.classMap.entries()) {
			if (key.endsWith(`.${parentClassName}`) || value.class.name === parentClassName) {
				return key;
			}
		}

		return null;
	}

	public getInterfaceMap(): Map<string, { file: string, interface: CodeStructure }> {
		return this.interfaceMap;
	}

	public getClassMap(): Map<string, { file: string, class: CodeStructure }> {
		return this.classMap;
	}

	public getImplementationMap(): Map<string, any[]> {
		return this.implementationMap;
	}

	public getExtensionMap(): Map<string, any[]> {
		return this.extensionMap;
	}

	public setAllFiles(files: { file: string, content: string, language: string }[]): void {
		this.allFiles = files.map(file => file.file);
	}

	public getAllFiles(): string[] {
		return this.allFiles;
	}
}
