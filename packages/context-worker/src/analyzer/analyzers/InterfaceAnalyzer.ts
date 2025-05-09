import { CodeCollector } from "../CodeCollector";
import { InterfaceImplementation, MultiImplementation } from "../CodeAnalysisResult";
import { ICodeAnalyzer } from "./ICodeAnalyzer";

export class InterfaceAnalyzer implements ICodeAnalyzer {
    public async analyze(codeCollector: CodeCollector): Promise<{
        interfaces: InterfaceImplementation[];
        multiImplementers: MultiImplementation[];
        stats: {
            totalInterfaces: number;
            implementedInterfaces: number;
            unimplementedInterfaces: number;
            multiImplementerCount: number;
        };
    }> {
        const interfaceMap = codeCollector.getInterfaceMap();
        const implementationMap = codeCollector.getImplementationMap();
        const classMap = codeCollector.getClassMap();

        return this.getImplementationResults(interfaceMap, implementationMap, classMap);
    }

    private getImplementationResults(interfaceMap: Map<string, any>, implementationMap: Map<string, any[]>, classMap: Map<string, any>): {
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
        const classToInterfacesMap = new Map<string, Set<string>>();

        interfaces.forEach((item: any) => {
            const intf = item.interface;
            const interfaceKey = intf.canonicalName || `${intf.package}.${intf.name}`;
            const implementations = implementationMap.get(interfaceKey) || [];
            const uniqueImplementations = this.deduplicateImplementations(implementations);

            uniqueImplementations.forEach(impl => {
                const classKey = `${impl.className}:${impl.classFile}`;
                if (!classToInterfacesMap.has(classKey)) {
                    classToInterfacesMap.set(classKey, new Set());
                }
                classToInterfacesMap.get(classKey)!.add(interfaceKey);
            });

            const methodCount = intf.methods ? intf.methods.length : 0;
            const interfaceResult: InterfaceImplementation = {
                interfaceName: intf.name,
                interfaceFile: item.file,
                methodCount: methodCount,
                package: intf.package || '',
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
                    position: impl.class ? {
                        start: impl.class.start,
                        end: impl.class.end
                    } : undefined
                }));
            }

            interfaceResults.push(interfaceResult);
        });

        const multiImplementers: MultiImplementation[] = [];
        const sortedClasses = Array.from(classToInterfacesMap.entries())
            .filter(([_, interfaces]) => interfaces.size > 1)
            .sort((a, b) => b[1].size - a[1].size);

        sortedClasses.forEach(([classKey, interfaceSet]) => {
            if (interfaceSet.size > 1) {
                const [className, classFile] = classKey.split(':');
                const classObj = Array.from(classMap.values())
                    .find(item => item.class.name === className ||
                        (item.class.canonicalName && item.class.canonicalName === className));

                const multiImplementer: MultiImplementation = {
                    className: className,
                    classFile: classFile,
                    position: classObj ? {
                        start: classObj.class.start,
                        end: classObj.class.end
                    } : undefined,
                    interfaceCount: interfaceSet.size,
                    interfaces: []
                };

                Array.from(interfaceSet).forEach(interfaceKey => {
                    const interfaceInfo = interfaceMap.get(interfaceKey);
                    if (interfaceInfo) {
                        multiImplementer.interfaces.push({
                            interfaceName: interfaceInfo.interface.name,
                            interfaceFile: interfaceInfo.file,
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

    private deduplicateImplementations(implementations: any[]): any[] {
        const uniqueMap = new Map<string, any>();

        for (const impl of implementations) {
            const key = `${impl.className}:${impl.classFile}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, impl);
            }
        }

        return Array.from(uniqueMap.values());
    }
}
