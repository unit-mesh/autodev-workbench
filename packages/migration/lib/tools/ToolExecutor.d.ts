/**
 * 工具执行器
 */
import { ContextAwareComponent } from '../core/ContextAwareComponent';
import { ToolRegistry } from './ToolRegistry';
import { IMigrationContext, ComponentOptions, IToolExecutor, ToolDefinition, ToolResult, ToolCall } from '../types';
export declare class ToolExecutor extends ContextAwareComponent implements IToolExecutor {
    private registry;
    private executionHistory;
    constructor(name: string, context: IMigrationContext, options?: ComponentOptions);
    protected onInitialize(): Promise<void>;
    protected onExecute(): Promise<any>;
    registerTool(tool: ToolDefinition): void;
    executeTool(toolName: string, params: any): Promise<ToolResult>;
    private executeDefaultTool;
    executeToolChain(toolCalls: ToolCall[]): Promise<ToolResult[]>;
    getAvailableTools(): ToolDefinition[];
    getToolsByCategory(category: string): ToolDefinition[];
    getToolsDescription(): string;
    getToolsSchema(): any;
    getRegistry(): ToolRegistry;
    getExecutionHistory(): any[];
    clearExecutionHistory(): void;
    getExecutionStats(): any;
    private logAvailableTools;
    private sanitizeParams;
    protected onCleanup(): void;
    hasTool(name: string): boolean;
    removeTool(name: string): boolean;
    registerTools(tools: ToolDefinition[]): void;
    executeToolsParallel(toolCalls: ToolCall[]): Promise<ToolResult[]>;
}
//# sourceMappingURL=ToolExecutor.d.ts.map