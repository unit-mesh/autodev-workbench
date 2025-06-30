/**
 * 工具注册表
 */
import { ToolDefinition } from '../types';
export declare class ToolRegistry {
    private tools;
    private categories;
    constructor();
    private registerDefaultTools;
    registerTool(toolDefinition: ToolDefinition): void;
    getTool(name: string): ToolDefinition | undefined;
    getAllTools(): ToolDefinition[];
    getToolsByCategory(category: string): ToolDefinition[];
    getCategories(): string[];
    getToolsDescription(): string;
    getToolsSchema(): any;
    private validateFilePath;
    private validateContent;
    private validateCommand;
    hasTool(name: string): boolean;
    removeTool(name: string): boolean;
    clear(): void;
}
//# sourceMappingURL=ToolRegistry.d.ts.map