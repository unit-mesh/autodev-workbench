import { CodeCollector } from "../CodeCollector";
import { ClassExtension, InheritanceHierarchy, MultiExtension } from "../CodeAnalysisResult";
import { ICodeAnalyzer } from "./ICodeAnalyzer";

export class ClassHierarchyAnalyzer implements ICodeAnalyzer {
    private classHierarchyMap = new Map<string, { className: string, childInfo: any }[]>();

    public async analyze(codeCollector: CodeCollector): Promise<{
        extensions: ClassExtension[];
        multiExtensions: MultiExtension[];
        hierarchy: InheritanceHierarchy;
        stats: {
            extendedClassCount: number;
            totalExtensionRelations: number;
            multiExtendedClassCount: number;
        };
    }> {
        const classMap = codeCollector.getClassMap();
        const extensionMap = codeCollector.getExtensionMap();

        return this.getExtensionResults(classMap, extensionMap);
    }

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
        const classToParentsMap = new Map<string, Set<string>>();
        this.classHierarchyMap.clear();

        for (const item of classes) {
            const cls = item.class;
            const classKey = cls.canonicalName || `${cls.package}.${cls.name}`;
            const childClasses = extensionMap.get(classKey) || [];
            const uniqueChildClasses = this.deduplicateImplementations(childClasses);

            uniqueChildClasses.forEach(child => {
                const childKey = `${child.className}:${child.classFile}`;
                if (!classToParentsMap.has(childKey)) {
                    classToParentsMap.set(childKey, new Set());
                }
                classToParentsMap.get(childKey)!.add(classKey);

                if (!this.classHierarchyMap.has(classKey)) {
                    this.classHierarchyMap.set(classKey, []);
                }
                this.classHierarchyMap.get(classKey)!.push({
                    className: child.className,
                    childInfo: child
                });
            });

            if (uniqueChildClasses.length === 0) continue;

            extendedCount++;

            const extensionResult: ClassExtension = {
                parentName: cls.name,
                parentFile: item.file,
                package: cls.package || '',
                position: {
                    start: cls.start,
                    end: cls.end
                },
                children: uniqueChildClasses.map(child => ({
                    className: child.className,
                    classFile: child.classFile,
                    position: child.class ? {
                        start: child.class.start,
                        end: child.class.end
                    } : undefined
                }))
            };

            extensionResults.push(extensionResult);
        }

        const multiExtensions: MultiExtension[] = [];
        const sortedClasses = Array.from(classToParentsMap.entries())
            .filter(([_, parents]) => parents.size > 1)
            .sort((a, b) => b[1].size - a[1].size);

        sortedClasses.forEach(([classKey, parents]) => {
            if (parents.size > 1) {
                const [className, classFile] = classKey.split(':');

                const classObj = Array.from(classMap.values())
                    .find(item => item.class.name === className ||
                        (item.class.canonicalName && item.class.canonicalName === className));

                const multiExtension: MultiExtension = {
                    className: className,
                    classFile: classFile,
                    position: classObj ? {
                        start: classObj.class.start,
                        end: classObj.class.end
                    } : undefined,
                    parentCount: parents.size,
                    parents: []
                };

                Array.from(parents).forEach(parentKey => {
                    const parentInfo = classMap.get(parentKey);
                    if (parentInfo) {
                        multiExtension.parents.push({
                            parentName: parentInfo.class.name,
                            parentFile: parentInfo.file,
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

    private analyzeInheritanceHierarchyData(hierarchyMap: Map<string, {
        className: string,
        childInfo: any
    }[]>, classMap: Map<string, any>): InheritanceHierarchy {
        const allClasses = new Set<string>();
        const allChildClasses = new Set<string>();

        for (const [parentClass, childInfoArray] of hierarchyMap.entries()) {
            allClasses.add(parentClass);
            childInfoArray.forEach(child => {
                allClasses.add(child.className);
                allChildClasses.add(child.className);
            });
        }

        const rootClasses = Array.from(allClasses).filter(cls => !allChildClasses.has(cls));
        const classDepths = new Map<string, { depth: number, childInfo?: any }>();

        for (const rootClass of rootClasses) {
            this.calculateInheritanceDepthWithInfo(rootClass, hierarchyMap, classDepths, 0);
        }

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

    private calculateInheritanceDepthWithInfo(
        className: string,
        hierarchyMap: Map<string, { className: string, childInfo: any }[]>,
        depthMap: Map<string, { depth: number, childInfo?: any }>,
        currentDepth: number
    ): number {
        if (depthMap.has(className)) {
            return depthMap.get(className)!.depth;
        }

        const children = hierarchyMap.get(className) || [];
        if (children.length === 0) {
            depthMap.set(className, { depth: currentDepth });
            return currentDepth;
        }

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

    private findClassInfoByName(className: string, classMap: Map<string, any>): any {
        if (classMap.has(className)) {
            return classMap.get(className);
        }

        const simpleName = className.includes('.') ? className.split('.').pop()! : className;

        for (const [key, value] of classMap.entries()) {
            if (value.class.name === simpleName) {
                return value;
            }

            if (value.class.canonicalName === className) {
                return value;
            }

            if (key.endsWith(`.${simpleName}`)) {
                return value;
            }
        }

        return null;
    }

    private tryFindClassFile(className: string, classMap: Map<string, any>): string | null {
        for (const [_, value] of classMap.entries()) {
            if (value.class.name === className) {
                return value.file;
            }
        }
        return null;
    }
}
