/**
 * 配置管理器
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { MigrationConfig, MigrationPreset } from '../types';
import { ConfigurationError } from '../types/errors';

export class ConfigManager {
  private config: MigrationConfig;
  private presets: Map<string, MigrationPreset> = new Map();
  private configPath?: string;

  constructor(config: MigrationConfig = {}) {
    this.config = this.mergeWithDefaults(config);
    this.loadDefaultPresets();
  }

  private mergeWithDefaults(config: MigrationConfig): MigrationConfig {
    const defaults: MigrationConfig = {
      mode: 'auto',
      dryRun: false,
      verbose: false,
      maxRetries: 3,
      ai: {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.1,
        timeout: 60000
      },
      execution: {
        parallelism: {
          enabled: true,
          maxConcurrency: 4
        },
        backup: {
          enabled: true,
          location: '.migration-backup'
        }
      },
      validation: {
        build: {
          enabled: true,
          timeout: 300000
        }
      }
    };

    return this.deepMerge(defaults, config);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private loadDefaultPresets(): void {
    // Vue 2 to Vue 3 预设
    this.presets.set('vue2-to-vue3', {
      name: 'Vue 2 to Vue 3 Migration',
      description: 'Vue 2 项目迁移到 Vue 3',
      source: {
        framework: 'vue',
        version: '2.x',
        patterns: ['**/*.vue', '**/*.js'],
        dependencies: ['vue@^2', 'vue-template-compiler']
      },
      target: {
        framework: 'vue',
        version: '3.x',
        dependencies: ['vue@^3', '@vue/compiler-sfc']
      },
      steps: [
        {
          name: 'dependency-upgrade',
          description: '升级依赖到Vue 3版本',
          order: 1,
          required: true,
          agent: 'DependencyAgent'
        },
        {
          name: 'code-migration',
          description: '迁移Vue组件代码',
          order: 2,
          required: true,
          agent: 'FixAgent'
        },
        {
          name: 'ai-repair',
          description: 'AI修复迁移失败的文件',
          order: 3,
          required: false,
          agent: 'FixAgent'
        },
        {
          name: 'build-validation',
          description: '构建验证和错误修复',
          order: 4,
          required: true,
          agent: 'ValidationAgent'
        }
      ],
      tools: ['gogocode', 'eslint', 'webpack-codemod']
    });

    // React 16 to React 18 预设
    this.presets.set('react16-to-react18', {
      name: 'React 16 to React 18 Migration',
      description: 'React 16 项目迁移到 React 18',
      source: {
        framework: 'react',
        version: '16.x',
        patterns: ['**/*.jsx', '**/*.tsx', '**/*.js'],
        dependencies: ['react@^16', 'react-dom@^16']
      },
      target: {
        framework: 'react',
        version: '18.x',
        dependencies: ['react@^18', 'react-dom@^18']
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
          name: 'concurrent-features',
          description: '迁移到并发特性',
          order: 2,
          required: false,
          agent: 'FixAgent'
        },
        {
          name: 'strict-mode-fixes',
          description: '修复严格模式问题',
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
      tools: ['react-codemod', 'eslint']
    });
  }

  public getConfig(): MigrationConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<MigrationConfig>): void {
    this.config = this.deepMerge(this.config, updates);
  }

  public setConfig(config: MigrationConfig): void {
    this.config = this.mergeWithDefaults(config);
  }

  public async loadFromFile(filePath: string): Promise<void> {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new ConfigurationError(`配置文件不存在: ${filePath}`);
      }

      const fileContent = await fs.readFile(filePath, 'utf8');
      let configData: any;

      if (filePath.endsWith('.json')) {
        configData = JSON.parse(fileContent);
      } else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        // 动态导入JS配置文件
        const absolutePath = path.resolve(filePath);
        delete require.cache[absolutePath];
        configData = require(absolutePath);
        
        // 如果是ES模块导出
        if (configData.default) {
          configData = configData.default;
        }
      } else {
        throw new ConfigurationError(`不支持的配置文件格式: ${filePath}`);
      }

      this.config = this.mergeWithDefaults(configData);
      this.configPath = filePath;

      // 加载自定义预设
      if (configData.presets) {
        Object.entries(configData.presets).forEach(([name, preset]) => {
          this.presets.set(name, preset as MigrationPreset);
        });
      }

    } catch (error) {
      throw new ConfigurationError(
        `加载配置文件失败: ${error instanceof Error ? error.message : error}`,
        filePath
      );
    }
  }

  public async saveToFile(filePath?: string): Promise<void> {
    const outputPath = filePath || this.configPath;
    
    if (!outputPath) {
      throw new ConfigurationError('未指定配置文件路径');
    }

    try {
      const configData = {
        ...this.config,
        presets: Object.fromEntries(this.presets.entries())
      };

      await fs.ensureDir(path.dirname(outputPath));

      if (outputPath.endsWith('.json')) {
        await fs.writeJson(outputPath, configData, { spaces: 2 });
      } else if (outputPath.endsWith('.js')) {
        const jsContent = `module.exports = ${JSON.stringify(configData, null, 2)};`;
        await fs.writeFile(outputPath, jsContent, 'utf8');
      } else {
        throw new ConfigurationError(`不支持的配置文件格式: ${outputPath}`);
      }

      this.configPath = outputPath;

    } catch (error) {
      throw new ConfigurationError(
        `保存配置文件失败: ${error instanceof Error ? error.message : error}`,
        outputPath
      );
    }
  }

  public getPreset(name: string): MigrationPreset | undefined {
    return this.presets.get(name);
  }

  public getAllPresets(): Map<string, MigrationPreset> {
    return new Map(this.presets);
  }

  public addPreset(name: string, preset: MigrationPreset): void {
    this.presets.set(name, preset);
  }

  public removePreset(name: string): boolean {
    return this.presets.delete(name);
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证基本配置
    if (!this.config.mode || !['auto', 'interactive', 'preview'].includes(this.config.mode)) {
      errors.push('无效的执行模式');
    }

    // 验证AI配置
    if (this.config.ai) {
      if (this.config.ai.maxTokens && (this.config.ai.maxTokens < 100 || this.config.ai.maxTokens > 32000)) {
        errors.push('AI maxTokens 必须在 100-32000 之间');
      }

      if (this.config.ai.temperature && (this.config.ai.temperature < 0 || this.config.ai.temperature > 2)) {
        errors.push('AI temperature 必须在 0-2 之间');
      }
    }

    // 验证执行配置
    if (this.config.execution?.parallelism?.maxConcurrency) {
      const maxConcurrency = this.config.execution.parallelism.maxConcurrency;
      if (maxConcurrency < 1 || maxConcurrency > 16) {
        errors.push('并发数量必须在 1-16 之间');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public getConfigSummary(): any {
    return {
      mode: this.config.mode,
      aiProvider: this.config.ai?.provider,
      presetsCount: this.presets.size,
      dryRun: this.config.dryRun,
      verbose: this.config.verbose,
      configPath: this.configPath
    };
  }

  // 环境变量支持
  public loadFromEnvironment(): void {
    const envConfig: Partial<MigrationConfig> = {};

    // AI配置
    if (process.env.AI_MIGRATION_PROVIDER) {
      envConfig.ai = {
        ...envConfig.ai,
        provider: process.env.AI_MIGRATION_PROVIDER
      };
    }

    if (process.env.AI_MIGRATION_MODEL) {
      envConfig.ai = {
        ...envConfig.ai,
        model: process.env.AI_MIGRATION_MODEL
      };
    }

    if (process.env.AI_MIGRATION_API_KEY) {
      envConfig.aiApiKey = process.env.AI_MIGRATION_API_KEY;
    }

    // 执行配置
    if (process.env.AI_MIGRATION_DRY_RUN === 'true') {
      envConfig.dryRun = true;
    }

    if (process.env.AI_MIGRATION_VERBOSE === 'true') {
      envConfig.verbose = true;
    }

    if (process.env.AI_MIGRATION_MAX_RETRIES) {
      envConfig.maxRetries = parseInt(process.env.AI_MIGRATION_MAX_RETRIES, 10);
    }

    this.updateConfig(envConfig);
  }

  // 配置模板生成
  public generateTemplate(presetName?: string): MigrationConfig {
    const template: MigrationConfig = {
      mode: 'auto',
      dryRun: false,
      verbose: false,
      maxRetries: 3,
      ai: {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.1
      }
    };

    if (presetName) {
      const preset = this.getPreset(presetName);
      if (preset) {
        template.source = preset.source;
        template.target = preset.target;
      }
    }

    return template;
  }
}
