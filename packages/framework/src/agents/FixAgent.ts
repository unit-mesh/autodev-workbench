/**
 * 修复代理 - 负责代码修复和迁移
 */

import { BaseAIAgent } from './BaseAIAgent';
import {
  IMigrationContext,
  ComponentOptions,
  IAIService,
  IToolExecutor
} from '../types';

export class FixAgent extends BaseAIAgent {
  private fixedFiles: string[] = [];

  constructor(
    context: IMigrationContext,
    aiService: IAIService,
    toolExecutor: IToolExecutor,
    options: ComponentOptions = {}
  ) {
    super('FixAgent', context, aiService, toolExecutor, options);
  }

  protected loadPromptTemplates(): void {
    this.promptTemplates.set('code-fix', `
你是一个专业的代码迁移专家。请修复以下代码文件，使其兼容目标版本：

文件路径: {filePath}
当前框架: {framework} {currentVersion}
目标框架: {framework} {targetVersion}

当前代码:
{currentCode}

错误信息:
{errorMessage}

请提供修复后的完整代码，确保：
1. 语法正确
2. 兼容目标版本
3. 保持原有功能
4. 遵循最佳实践

请只返回修复后的代码，不要包含其他说明。
    `);
  }

  protected async onExecute(): Promise<any> {
    this.log('开始代码修复...');
    
    try {
      // 获取需要修复的文件列表
      const filesToFix = await this.identifyFilesToFix();
      
      // 批量修复文件
      const fixResults = await this.batchFixFiles(filesToFix);
      
      const result = {
        totalFiles: filesToFix.length,
        fixedFiles: this.fixedFiles.length,
        results: fixResults,
        timestamp: new Date().toISOString()
      };
      
      this.context.recordResult('fix', result);
      this.context.stats.filesModified = this.fixedFiles.length;
      
      this.log(`代码修复完成，修复了 ${this.fixedFiles.length} 个文件`);
      
      return result;
      
    } catch (error) {
      this.logError('代码修复失败', error as Error);
      throw error;
    }
  }

  private async identifyFilesToFix(): Promise<string[]> {
    // 简化实现：返回所有相关文件
    const allFiles = await this.listProjectFiles();
    const targetExtensions = ['.vue', '.js', '.jsx', '.ts', '.tsx'];
    
    return allFiles.filter(file => 
      targetExtensions.some(ext => file.endsWith(ext))
    ).slice(0, 10); // 限制数量以避免过多处理
  }

  private async batchFixFiles(files: string[]): Promise<any[]> {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        this.reportProgress(
          (i / files.length) * 100,
          `修复文件: ${file}`
        );
        
        const result = await this.fixSingleFile(file);
        results.push({ file, success: true, result });
        
        if (result.modified) {
          this.fixedFiles.push(file);
        }
        
      } catch (error) {
        results.push({ file, success: false, error: (error as Error).message });
        this.logError(`修复文件失败: ${file}`, error as Error);
      }
    }
    
    return results;
  }

  private async fixSingleFile(filePath: string): Promise<any> {
    this.log(`修复文件: ${filePath}`);
    
    // 读取文件内容
    const currentCode = await this.readProjectFile(filePath);
    
    if (!currentCode) {
      return { modified: false, reason: '文件为空或读取失败' };
    }
    
    // 生成修复提示词
    const prompt = this.buildPrompt('code-fix', {
      filePath,
      framework: this.context.project.framework || 'unknown',
      currentVersion: this.context.project.version || 'unknown',
      targetVersion: 'latest',
      currentCode,
      errorMessage: '兼容性问题'
    });
    
    // AI修复
    const fixedCode = await this.analyzeWithAI(prompt, { 
      type: 'code-fix',
      fileName: filePath 
    });
    
    // 检查是否需要修改
    if (this.shouldApplyFix(currentCode, fixedCode)) {
      // 写入修复后的代码
      if (!this.isDryRun()) {
        const success = await this.writeProjectFile(filePath, fixedCode, true);
        if (success) {
          return { 
            modified: true, 
            originalSize: currentCode.length, 
            newSize: fixedCode.length 
          };
        } else {
          return { modified: false, reason: '写入失败' };
        }
      } else {
        return { 
          modified: true, 
          dryRun: true,
          originalSize: currentCode.length, 
          newSize: fixedCode.length 
        };
      }
    }
    
    return { modified: false, reason: '无需修改' };
  }

  private shouldApplyFix(originalCode: string, fixedCode: string): boolean {
    // 基本检查
    if (!fixedCode || fixedCode.trim().length === 0) {
      return false;
    }
    
    // 检查是否有实质性变化
    const normalizedOriginal = originalCode.replace(/\s+/g, ' ').trim();
    const normalizedFixed = fixedCode.replace(/\s+/g, ' ').trim();
    
    if (normalizedOriginal === normalizedFixed) {
      return false;
    }
    
    // 检查代码长度变化是否合理
    const lengthRatio = fixedCode.length / originalCode.length;
    if (lengthRatio < 0.5 || lengthRatio > 2.0) {
      this.logWarning('修复后代码长度变化过大，跳过应用');
      return false;
    }
    
    return true;
  }

  public async fixSpecificFile(filePath: string, errorMessage?: string): Promise<any> {
    try {
      const currentCode = await this.readProjectFile(filePath);
      
      const prompt = this.buildPrompt('code-fix', {
        filePath,
        framework: this.context.project.framework || 'unknown',
        currentVersion: this.context.project.version || 'unknown',
        targetVersion: 'latest',
        currentCode,
        errorMessage: errorMessage || '需要修复的问题'
      });
      
      const fixedCode = await this.analyzeWithAI(prompt, { 
        type: 'code-fix',
        fileName: filePath 
      });
      
      if (this.shouldApplyFix(currentCode, fixedCode)) {
        if (!this.isDryRun()) {
          await this.writeProjectFile(filePath, fixedCode, true);
        }
        return { success: true, modified: true, fixedCode };
      } else {
        return { success: true, modified: false, reason: '无需修改' };
      }
      
    } catch (error) {
      this.logError(`单文件修复失败: ${filePath}`, error as Error);
      throw error;
    }
  }

  public async applyBulkFixes(fixes: Array<{ filePath: string; fixedCode: string }>): Promise<any[]> {
    const results = [];
    
    for (const fix of fixes) {
      try {
        if (!this.isDryRun()) {
          await this.writeProjectFile(fix.filePath, fix.fixedCode, true);
        }
        
        results.push({
          filePath: fix.filePath,
          success: true,
          applied: !this.isDryRun()
        });
        
        if (!this.isDryRun()) {
          this.fixedFiles.push(fix.filePath);
        }
        
      } catch (error) {
        results.push({
          filePath: fix.filePath,
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return results;
  }

  public getFixedFiles(): string[] {
    return [...this.fixedFiles];
  }

  public getFixStats(): any {
    return {
      totalFixed: this.fixedFiles.length,
      fixedFiles: this.fixedFiles,
      agentStats: this.getAgentStats()
    };
  }
}
