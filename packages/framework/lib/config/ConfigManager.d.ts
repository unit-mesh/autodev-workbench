/**
 * 配置管理器
 */
import { MigrationConfig, MigrationPreset } from '../types';
export declare class ConfigManager {
    private config;
    private presets;
    private configPath?;
    constructor(config?: MigrationConfig);
    private mergeWithDefaults;
    private deepMerge;
    private loadDefaultPresets;
    getConfig(): MigrationConfig;
    updateConfig(updates: Partial<MigrationConfig>): void;
    setConfig(config: MigrationConfig): void;
    loadFromFile(filePath: string): Promise<void>;
    saveToFile(filePath?: string): Promise<void>;
    getPreset(name: string): MigrationPreset | undefined;
    getAllPresets(): Map<string, MigrationPreset>;
    addPreset(name: string, preset: MigrationPreset): void;
    removePreset(name: string): boolean;
    validateConfig(): {
        valid: boolean;
        errors: string[];
    };
    getConfigSummary(): any;
    loadFromEnvironment(): void;
    generateTemplate(presetName?: string): MigrationConfig;
}
//# sourceMappingURL=ConfigManager.d.ts.map