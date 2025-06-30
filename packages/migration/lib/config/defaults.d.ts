/**
 * 默认配置
 */
import { MigrationConfig } from '../types';
export declare const defaultConfig: MigrationConfig;
export declare const presetConfigs: {
    'vue2-to-vue3': {
        source: {
            framework: string;
            version: string;
        };
        target: {
            framework: string;
            version: string;
        };
        mode?: "auto" | "interactive" | "preview";
        sourceToTargetMode?: boolean;
        sourcePath?: string;
        targetPath?: string;
        workingPath?: string;
        aiProvider?: string;
        aiApiKey?: string;
        dryRun?: boolean;
        verbose?: boolean;
        maxRetries?: number;
    };
    'react16-to-react18': {
        source: {
            framework: string;
            version: string;
        };
        target: {
            framework: string;
            version: string;
        };
        mode?: "auto" | "interactive" | "preview";
        sourceToTargetMode?: boolean;
        sourcePath?: string;
        targetPath?: string;
        workingPath?: string;
        aiProvider?: string;
        aiApiKey?: string;
        dryRun?: boolean;
        verbose?: boolean;
        maxRetries?: number;
    };
    'angular12-to-angular15': {
        source: {
            framework: string;
            version: string;
        };
        target: {
            framework: string;
            version: string;
        };
        mode?: "auto" | "interactive" | "preview";
        sourceToTargetMode?: boolean;
        sourcePath?: string;
        targetPath?: string;
        workingPath?: string;
        aiProvider?: string;
        aiApiKey?: string;
        dryRun?: boolean;
        verbose?: boolean;
        maxRetries?: number;
    };
};
//# sourceMappingURL=defaults.d.ts.map