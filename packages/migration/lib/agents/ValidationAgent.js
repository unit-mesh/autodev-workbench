"use strict";
/**
 * 验证代理 - 负责验证迁移结果
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationAgent = void 0;
const BaseAIAgent_1 = require("./BaseAIAgent");
class ValidationAgent extends BaseAIAgent_1.BaseAIAgent {
    constructor(context, aiService, toolExecutor, options = {}) {
        super('ValidationAgent', context, aiService, toolExecutor, options);
    }
    loadPromptTemplates() {
        this.promptTemplates.set('code-validation', `
请验证以下代码是否符合 {framework} {targetVersion} 的要求：

文件路径: {filePath}
代码内容:
{code}

请检查：
1. 语法正确性
2. API兼容性
3. 最佳实践
4. 潜在问题

请以JSON格式返回验证结果：
{
  "valid": true|false,
  "errors": ["错误列表"],
  "warnings": ["警告列表"],
  "suggestions": ["改进建议"],
  "score": 0-100
}
    `);
    }
    async onExecute() {
        this.log('开始验证迁移结果...');
        try {
            // 获取修复后的文件列表
            const filesToValidate = this.getFilesToValidate();
            // 验证文件
            const validationResults = await this.validateFiles(filesToValidate);
            // 构建验证
            const buildResult = await this.validateBuild();
            // 测试验证（如果启用）
            const testResult = await this.validateTests();
            const result = {
                fileValidation: validationResults,
                buildValidation: buildResult,
                testValidation: testResult,
                summary: this.generateValidationSummary(validationResults, buildResult, testResult),
                timestamp: new Date().toISOString()
            };
            this.context.recordResult('validation', result);
            this.log('验证完成');
            return result;
        }
        catch (error) {
            this.logError('验证失败', error);
            throw error;
        }
    }
    getFilesToValidate() {
        // 获取修复后的文件列表
        const fixResults = this.context.phases.results.fix;
        if (fixResults?.results) {
            return fixResults.results
                .filter((r) => r.success && r.result?.modified)
                .map((r) => r.file);
        }
        // 如果没有修复结果，验证关键文件
        return ['package.json', 'src/main.js', 'src/App.vue'].filter(file => this.context.project.files?.includes(file));
    }
    async validateFiles(files) {
        const results = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                this.reportProgress((i / files.length) * 50, // 文件验证占总进度的50%
                `验证文件: ${file}`);
                const result = await this.validateSingleFile(file);
                results.push({ file, success: true, result });
            }
            catch (error) {
                results.push({ file, success: false, error: error.message });
                this.logError(`文件验证失败: ${file}`, error);
            }
        }
        return results;
    }
    async validateSingleFile(filePath) {
        const code = await this.readProjectFile(filePath);
        if (!code) {
            return { valid: false, errors: ['文件为空或读取失败'] };
        }
        // 基本语法检查
        const syntaxCheck = this.performSyntaxCheck(filePath, code);
        // AI验证（如果启用）
        let aiValidation = null;
        if (this.aiService.isEnabled()) {
            try {
                const prompt = this.buildPrompt('code-validation', {
                    framework: this.context.project.framework || 'unknown',
                    targetVersion: 'latest',
                    filePath,
                    code: code.length > 5000 ? code.substring(0, 5000) + '\n// ... 代码已截断' : code
                });
                const response = await this.analyzeWithAI(prompt, {
                    type: 'validation',
                    fileName: filePath
                });
                aiValidation = this.parseJSONResponse(response);
            }
            catch (error) {
                this.logWarning(`AI验证失败: ${filePath}`);
            }
        }
        // 合并验证结果
        return this.mergeValidationResults(syntaxCheck, aiValidation);
    }
    performSyntaxCheck(filePath, code) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };
        // 基本语法检查
        if (filePath.endsWith('.json')) {
            try {
                JSON.parse(code);
            }
            catch (error) {
                result.valid = false;
                result.errors.push(`JSON语法错误: ${error.message}`);
            }
        }
        // 检查常见问题
        if (filePath.endsWith('.vue') || filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            // 检查是否有明显的语法错误
            if (code.includes('import ') && !code.includes('from ')) {
                result.warnings.push('可能存在不完整的import语句');
            }
            // 检查括号匹配
            const openBraces = (code.match(/\{/g) || []).length;
            const closeBraces = (code.match(/\}/g) || []).length;
            if (openBraces !== closeBraces) {
                result.warnings.push('大括号可能不匹配');
            }
        }
        return result;
    }
    mergeValidationResults(syntaxCheck, aiValidation) {
        const merged = {
            valid: syntaxCheck.valid,
            errors: [...syntaxCheck.errors],
            warnings: [...syntaxCheck.warnings],
            suggestions: [...syntaxCheck.suggestions],
            score: syntaxCheck.valid ? 80 : 40
        };
        if (aiValidation) {
            merged.valid = merged.valid && (aiValidation.valid !== false);
            if (aiValidation.errors)
                merged.errors.push(...aiValidation.errors);
            if (aiValidation.warnings)
                merged.warnings.push(...aiValidation.warnings);
            if (aiValidation.suggestions)
                merged.suggestions.push(...aiValidation.suggestions);
            if (aiValidation.score)
                merged.score = Math.max(merged.score, aiValidation.score);
        }
        return merged;
    }
    async validateBuild() {
        this.log('执行构建验证...');
        this.reportProgress(75, '执行构建验证');
        try {
            // 检查是否有构建脚本
            const packageContent = await this.readProjectFile('package.json');
            if (!packageContent) {
                return { success: false, error: '无法读取package.json' };
            }
            const packageJson = JSON.parse(packageContent);
            const buildScript = packageJson.scripts?.build;
            if (!buildScript) {
                return {
                    success: true,
                    skipped: true,
                    reason: '未找到构建脚本'
                };
            }
            // 执行构建（如果不是干运行模式）
            if (!this.isDryRun()) {
                const buildOutput = await this.runCommand('npm', ['run', 'build']);
                return {
                    success: true,
                    output: buildOutput,
                    buildTime: Date.now()
                };
            }
            else {
                return {
                    success: true,
                    dryRun: true,
                    message: '干运行模式，跳过实际构建'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                buildTime: Date.now()
            };
        }
    }
    async validateTests() {
        this.log('执行测试验证...');
        this.reportProgress(90, '执行测试验证');
        try {
            const packageContent = await this.readProjectFile('package.json');
            if (!packageContent) {
                return { success: false, error: '无法读取package.json' };
            }
            const packageJson = JSON.parse(packageContent);
            const testScript = packageJson.scripts?.test;
            if (!testScript || testScript.includes('no test specified')) {
                return {
                    success: true,
                    skipped: true,
                    reason: '未配置测试脚本'
                };
            }
            // 执行测试（如果不是干运行模式且启用了测试）
            if (!this.isDryRun() && this.options.runTests) {
                const testOutput = await this.runCommand('npm', ['test']);
                return {
                    success: true,
                    output: testOutput,
                    testTime: Date.now()
                };
            }
            else {
                return {
                    success: true,
                    skipped: true,
                    reason: this.isDryRun() ? '干运行模式' : '测试验证未启用'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                testTime: Date.now()
            };
        }
    }
    generateValidationSummary(fileResults, buildResult, testResult) {
        const totalFiles = fileResults.length;
        const validFiles = fileResults.filter(r => r.success && r.result?.valid).length;
        const totalErrors = fileResults.reduce((sum, r) => sum + (r.result?.errors?.length || 0), 0);
        const totalWarnings = fileResults.reduce((sum, r) => sum + (r.result?.warnings?.length || 0), 0);
        return {
            fileValidation: {
                totalFiles,
                validFiles,
                validationRate: totalFiles > 0 ? validFiles / totalFiles : 0,
                totalErrors,
                totalWarnings
            },
            buildValidation: {
                success: buildResult.success,
                skipped: buildResult.skipped || false
            },
            testValidation: {
                success: testResult.success,
                skipped: testResult.skipped || false
            },
            overallSuccess: buildResult.success && totalErrors === 0,
            score: this.calculateOverallScore(fileResults, buildResult, testResult)
        };
    }
    calculateOverallScore(fileResults, buildResult, testResult) {
        let score = 0;
        let maxScore = 0;
        // 文件验证分数 (60%)
        if (fileResults.length > 0) {
            const avgFileScore = fileResults.reduce((sum, r) => sum + (r.result?.score || 0), 0) / fileResults.length;
            score += avgFileScore * 0.6;
        }
        maxScore += 60;
        // 构建验证分数 (30%)
        if (buildResult.success && !buildResult.skipped) {
            score += 30;
        }
        else if (buildResult.skipped) {
            score += 15; // 部分分数
        }
        maxScore += 30;
        // 测试验证分数 (10%)
        if (testResult.success && !testResult.skipped) {
            score += 10;
        }
        else if (testResult.skipped) {
            score += 5; // 部分分数
        }
        maxScore += 10;
        return Math.round((score / maxScore) * 100);
    }
    async validateSpecificFile(filePath) {
        try {
            return await this.validateSingleFile(filePath);
        }
        catch (error) {
            this.logError(`单文件验证失败: ${filePath}`, error);
            throw error;
        }
    }
}
exports.ValidationAgent = ValidationAgent;
//# sourceMappingURL=ValidationAgent.js.map