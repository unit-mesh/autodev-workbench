/**
 * 预设管理器
 */
import { MigrationPreset, MigrationStep } from '../types';
export declare class PresetManager {
    private presets;
    constructor();
    private loadDefaultPresets;
    addPreset(name: string, preset: MigrationPreset): void;
    getPreset(name: string): MigrationPreset | undefined;
    getAllPresets(): Map<string, MigrationPreset>;
    getPresetNames(): string[];
    removePreset(name: string): boolean;
    hasPreset(name: string): boolean;
    getPresetsByFramework(framework: string): MigrationPreset[];
    findCompatiblePresets(framework: string, version: string): MigrationPreset[];
    private isVersionCompatible;
    private parseVersion;
    validatePreset(preset: MigrationPreset): {
        valid: boolean;
        errors: string[];
    };
    createCustomPreset(name: string, sourceFramework: string, sourceVersion: string, targetFramework: string, targetVersion: string, steps: MigrationStep[]): MigrationPreset;
    exportPresets(): Record<string, MigrationPreset>;
    importPresets(presets: Record<string, MigrationPreset>): void;
    clear(): void;
}
//# sourceMappingURL=PresetManager.d.ts.map