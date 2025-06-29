"use strict";
/**
 * 预设管理器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresetManager = void 0;
class PresetManager {
    constructor() {
        this.presets = new Map();
        this.loadDefaultPresets();
    }
    loadDefaultPresets() {
        // Vue 2 to Vue 3 预设
        this.addPreset('vue2-to-vue3', {
            name: 'Vue 2 to Vue 3 Migration',
            description: 'Vue 2 项目迁移到 Vue 3',
            source: {
                framework: 'vue',
                version: '2.x',
                patterns: ['**/*.vue', '**/*.js', '**/*.ts'],
                dependencies: ['vue@^2', 'vue-template-compiler', 'vue-router@^3', 'vuex@^3']
            },
            target: {
                framework: 'vue',
                version: '3.x',
                dependencies: ['vue@^3', '@vue/compiler-sfc', 'vue-router@^4', 'vuex@^4']
            },
            steps: [
                {
                    name: 'dependency-upgrade',
                    description: '升级依赖到Vue 3版本',
                    order: 1,
                    required: true,
                    agent: 'DependencyAgent',
                    config: {
                        preserveVersions: false,
                        autoInstall: true,
                        backupPackageJson: true
                    }
                },
                {
                    name: 'code-migration',
                    description: '迁移Vue组件代码',
                    order: 2,
                    required: true,
                    agent: 'FixAgent',
                    config: {
                        useGogocode: true,
                        parallel: true,
                        backupFiles: true
                    }
                },
                {
                    name: 'ai-repair',
                    description: 'AI修复迁移失败的文件',
                    order: 3,
                    required: false,
                    agent: 'FixAgent',
                    config: {
                        maxAttempts: 3,
                        useContextFiles: true
                    }
                },
                {
                    name: 'build-validation',
                    description: '构建验证和错误修复',
                    order: 4,
                    required: true,
                    agent: 'ValidationAgent',
                    config: {
                        buildCommand: 'npm run build',
                        maxBuildAttempts: 5
                    }
                }
            ],
            tools: ['gogocode', 'eslint', 'webpack-codemod'],
            config: {
                aiPrompts: 'vue-migration-prompts',
                transformRules: [
                    'vue3-composition-api',
                    'vue3-global-api',
                    'vue3-lifecycle-hooks'
                ]
            }
        });
        // React 16 to React 18 预设
        this.addPreset('react16-to-react18', {
            name: 'React 16 to React 18 Migration',
            description: 'React 16 项目迁移到 React 18',
            source: {
                framework: 'react',
                version: '16.x',
                patterns: ['**/*.jsx', '**/*.tsx', '**/*.js', '**/*.ts'],
                dependencies: ['react@^16', 'react-dom@^16', 'react-router@^5']
            },
            target: {
                framework: 'react',
                version: '18.x',
                dependencies: ['react@^18', 'react-dom@^18', 'react-router@^6']
            },
            steps: [
                {
                    name: 'dependency-upgrade',
                    description: '升级React依赖',
                    order: 1,
                    required: true,
                    agent: 'DependencyAgent'
                },
                {
                    name: 'root-api-migration',
                    description: '迁移到新的Root API',
                    order: 2,
                    required: true,
                    agent: 'FixAgent',
                    config: {
                        updateRootAPI: true,
                        createRootElement: true
                    }
                },
                {
                    name: 'concurrent-features',
                    description: '迁移到并发特性',
                    order: 3,
                    required: false,
                    agent: 'FixAgent',
                    config: {
                        enableConcurrentMode: true,
                        updateSuspense: true
                    }
                },
                {
                    name: 'strict-mode-fixes',
                    description: '修复严格模式问题',
                    order: 4,
                    required: true,
                    agent: 'FixAgent'
                },
                {
                    name: 'build-validation',
                    description: '构建验证',
                    order: 5,
                    required: true,
                    agent: 'ValidationAgent'
                }
            ],
            tools: ['react-codemod', 'eslint', 'jscodeshift'],
            config: {
                aiPrompts: 'react-migration-prompts',
                transformRules: [
                    'react18-root-api',
                    'react18-strict-mode',
                    'react18-concurrent-features'
                ]
            }
        });
        // Angular 12 to Angular 15 预设
        this.addPreset('angular12-to-angular15', {
            name: 'Angular 12 to Angular 15 Migration',
            description: 'Angular 12 项目迁移到 Angular 15',
            source: {
                framework: 'angular',
                version: '12.x',
                patterns: ['**/*.ts', '**/*.html', '**/*.scss', '**/*.css'],
                dependencies: ['@angular/core@^12', '@angular/common@^12']
            },
            target: {
                framework: 'angular',
                version: '15.x',
                dependencies: ['@angular/core@^15', '@angular/common@^15']
            },
            steps: [
                {
                    name: 'ng-update',
                    description: '使用ng update升级',
                    order: 1,
                    required: true,
                    agent: 'AngularUpdateAgent',
                    config: {
                        updatePackages: ['@angular/core', '@angular/cli', '@angular/material']
                    }
                },
                {
                    name: 'standalone-components',
                    description: '迁移到独立组件',
                    order: 2,
                    required: false,
                    agent: 'FixAgent',
                    config: {
                        convertToStandalone: true,
                        updateBootstrap: true
                    }
                },
                {
                    name: 'ivy-renderer',
                    description: '确保Ivy渲染器配置',
                    order: 3,
                    required: true,
                    agent: 'FixAgent'
                },
                {
                    name: 'build-validation',
                    description: '构建验证',
                    order: 4,
                    required: true,
                    agent: 'ValidationAgent'
                }
            ],
            tools: ['ng-update', 'eslint', 'tslint-to-eslint'],
            config: {
                aiPrompts: 'angular-migration-prompts',
                transformRules: [
                    'angular15-standalone-components',
                    'angular15-ivy-renderer'
                ]
            }
        });
        // Node.js 14 to Node.js 18 预设
        this.addPreset('node14-to-node18', {
            name: 'Node.js 14 to Node.js 18 Migration',
            description: 'Node.js 14 项目迁移到 Node.js 18',
            source: {
                framework: 'node',
                version: '14.x',
                patterns: ['**/*.js', '**/*.ts', '**/*.mjs'],
                dependencies: []
            },
            target: {
                framework: 'node',
                version: '18.x',
                dependencies: []
            },
            steps: [
                {
                    name: 'node-version-check',
                    description: '检查Node.js版本兼容性',
                    order: 1,
                    required: true,
                    agent: 'AnalysisAgent'
                },
                {
                    name: 'dependency-audit',
                    description: '审计依赖兼容性',
                    order: 2,
                    required: true,
                    agent: 'DependencyAgent'
                },
                {
                    name: 'api-migration',
                    description: '迁移废弃的API',
                    order: 3,
                    required: true,
                    agent: 'FixAgent'
                },
                {
                    name: 'test-validation',
                    description: '运行测试验证',
                    order: 4,
                    required: true,
                    agent: 'ValidationAgent'
                }
            ],
            tools: ['npm-check-updates', 'eslint'],
            config: {
                aiPrompts: 'node-migration-prompts'
            }
        });
    }
    addPreset(name, preset) {
        this.presets.set(name, preset);
    }
    getPreset(name) {
        return this.presets.get(name);
    }
    getAllPresets() {
        return new Map(this.presets);
    }
    getPresetNames() {
        return Array.from(this.presets.keys());
    }
    removePreset(name) {
        return this.presets.delete(name);
    }
    hasPreset(name) {
        return this.presets.has(name);
    }
    getPresetsByFramework(framework) {
        return Array.from(this.presets.values()).filter(preset => preset.source.framework === framework);
    }
    findCompatiblePresets(framework, version) {
        return Array.from(this.presets.values()).filter(preset => {
            return preset.source.framework === framework &&
                this.isVersionCompatible(version, preset.source.version);
        });
    }
    isVersionCompatible(currentVersion, presetVersion) {
        // 简化的版本兼容性检查
        const current = this.parseVersion(currentVersion);
        const preset = this.parseVersion(presetVersion);
        if (!current || !preset) {
            return false;
        }
        return current.major === preset.major;
    }
    parseVersion(version) {
        const match = version.match(/^(\d+)\.(\d+)/);
        if (!match) {
            return null;
        }
        return {
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10)
        };
    }
    validatePreset(preset) {
        const errors = [];
        // 检查必需字段
        if (!preset.name)
            errors.push('预设名称不能为空');
        if (!preset.description)
            errors.push('预设描述不能为空');
        if (!preset.source?.framework)
            errors.push('源框架不能为空');
        if (!preset.target?.framework)
            errors.push('目标框架不能为空');
        if (!preset.steps || preset.steps.length === 0)
            errors.push('至少需要一个迁移步骤');
        // 检查步骤顺序
        if (preset.steps) {
            const orders = preset.steps.map(step => step.order);
            const uniqueOrders = new Set(orders);
            if (orders.length !== uniqueOrders.size) {
                errors.push('步骤顺序不能重复');
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    createCustomPreset(name, sourceFramework, sourceVersion, targetFramework, targetVersion, steps) {
        return {
            name,
            description: `${sourceFramework} ${sourceVersion} to ${targetFramework} ${targetVersion} Migration`,
            source: {
                framework: sourceFramework,
                version: sourceVersion
            },
            target: {
                framework: targetFramework,
                version: targetVersion
            },
            steps,
            tools: [],
            config: {}
        };
    }
    exportPresets() {
        return Object.fromEntries(this.presets.entries());
    }
    importPresets(presets) {
        for (const [name, preset] of Object.entries(presets)) {
            const validation = this.validatePreset(preset);
            if (validation.valid) {
                this.addPreset(name, preset);
            }
            else {
                console.warn(`跳过无效预设 ${name}:`, validation.errors);
            }
        }
    }
    clear() {
        this.presets.clear();
        this.loadDefaultPresets();
    }
}
exports.PresetManager = PresetManager;
//# sourceMappingURL=PresetManager.js.map