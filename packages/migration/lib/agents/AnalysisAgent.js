"use strict";
/**
 * 分析代理 - 负责项目分析和问题识别
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisAgent = void 0;
const BaseAIAgent_1 = require("./BaseAIAgent");
class AnalysisAgent extends BaseAIAgent_1.BaseAIAgent {
    constructor(context, aiService, toolExecutor, options = {}) {
        super('AnalysisAgent', context, aiService, toolExecutor, options);
    }
    loadPromptTemplates() {
        this.promptTemplates.set('project-analysis', `
你是一个专业的代码迁移分析专家。请分析以下项目信息：

项目路径: {projectPath}
框架: {framework}
当前版本: {currentVersion}
目标版本: {targetVersion}

文件列表:
{fileList}

package.json内容:
{packageJson}

请分析：
1. 迁移的复杂度和风险
2. 需要特别关注的文件和依赖
3. 推荐的迁移策略
4. 可能遇到的问题和解决方案

请以JSON格式返回分析结果：
{
  "complexity": "low|medium|high",
  "risks": [
    {
      "type": "dependency|syntax|breaking-change",
      "severity": "low|medium|high|critical",
      "description": "风险描述",
      "files": ["相关文件列表"],
      "mitigation": "缓解措施"
    }
  ],
  "recommendations": [
    {
      "category": "dependency|code|build|test",
      "priority": "high|medium|low",
      "description": "建议描述",
      "action": "具体行动"
    }
  ],
  "estimatedEffort": {
    "hours": 估计小时数,
    "confidence": "high|medium|low"
  }
}
    `);
        this.promptTemplates.set('dependency-analysis', `
请分析以下依赖的兼容性：

当前依赖:
{dependencies}

目标框架版本: {targetVersion}

请识别：
1. 不兼容的依赖
2. 需要升级的依赖
3. 可能的替代方案
4. 升级风险评估

请以JSON格式返回结果：
{
  "incompatible": [
    {
      "name": "依赖名称",
      "currentVersion": "当前版本",
      "reason": "不兼容原因",
      "alternatives": ["替代方案"]
    }
  ],
  "upgrades": [
    {
      "name": "依赖名称",
      "currentVersion": "当前版本",
      "targetVersion": "目标版本",
      "breakingChanges": ["破坏性变更列表"],
      "migrationGuide": "迁移指南链接或说明"
    }
  ],
  "risks": [
    {
      "dependency": "依赖名称",
      "risk": "风险描述",
      "impact": "影响评估"
    }
  ]
}
    `);
        this.promptTemplates.set('file-analysis', `
请分析以下代码文件的迁移需求：

文件路径: {filePath}
文件内容:
{fileContent}

当前框架: {framework} {currentVersion}
目标框架: {framework} {targetVersion}

请分析：
1. 需要修改的代码模式
2. 可能的兼容性问题
3. 建议的修改方案

请以JSON格式返回：
{
  "needsMigration": true|false,
  "issues": [
    {
      "line": 行号,
      "type": "问题类型",
      "description": "问题描述",
      "suggestion": "修改建议"
    }
  ],
  "complexity": "low|medium|high",
  "estimatedTime": "预计修改时间(分钟)"
}
    `);
    }
    async onExecute() {
        this.log('开始项目分析...');
        try {
            // 收集项目信息
            const projectInfo = await this.gatherProjectInfo();
            // AI分析
            const analysis = await this.performAIAnalysis(projectInfo);
            // 依赖分析
            const dependencyAnalysis = await this.analyzeDependencies(projectInfo);
            // 文件分析
            const fileAnalysis = await this.analyzeKeyFiles(projectInfo);
            const result = {
                projectInfo,
                analysis,
                dependencyAnalysis,
                fileAnalysis,
                timestamp: new Date().toISOString()
            };
            this.context.recordResult('analysis', result);
            this.log('项目分析完成');
            return result;
        }
        catch (error) {
            this.logError('项目分析失败', error);
            throw error;
        }
    }
    async gatherProjectInfo() {
        const info = {
            projectPath: this.context.projectPath,
            framework: this.context.project.framework,
            currentVersion: this.context.project.version
        };
        // 读取package.json
        try {
            const packageContent = await this.readProjectFile('package.json');
            info.packageJson = packageContent;
            info.dependencies = JSON.parse(packageContent).dependencies || {};
        }
        catch (error) {
            this.log('无法读取package.json');
            info.packageJson = '{}';
            info.dependencies = {};
        }
        // 获取文件列表
        info.fileList = await this.listProjectFiles();
        return info;
    }
    async performAIAnalysis(projectInfo) {
        const prompt = this.buildPrompt('project-analysis', {
            projectPath: projectInfo.projectPath,
            framework: projectInfo.framework || 'unknown',
            currentVersion: projectInfo.currentVersion || 'unknown',
            targetVersion: 'latest',
            fileList: projectInfo.fileList.slice(0, 20).join('\n'),
            packageJson: projectInfo.packageJson
        });
        const response = await this.analyzeWithAI(prompt, { type: 'project-analysis' });
        try {
            return this.parseJSONResponse(response);
        }
        catch (error) {
            this.log('AI响应解析失败，返回原始响应');
            return { rawResponse: response };
        }
    }
    async analyzeDependencies(projectInfo) {
        if (!projectInfo.dependencies || Object.keys(projectInfo.dependencies).length === 0) {
            return { message: '未找到依赖信息' };
        }
        const prompt = this.buildPrompt('dependency-analysis', {
            dependencies: JSON.stringify(projectInfo.dependencies, null, 2),
            targetVersion: 'latest'
        });
        const response = await this.analyzeWithAI(prompt, { type: 'dependency-analysis' });
        try {
            return this.parseJSONResponse(response);
        }
        catch (error) {
            this.log('依赖分析响应解析失败');
            return { rawResponse: response };
        }
    }
    async analyzeKeyFiles(projectInfo) {
        const keyFiles = this.identifyKeyFiles(projectInfo.fileList);
        const fileAnalyses = [];
        // 限制分析的文件数量以避免过多的AI调用
        const filesToAnalyze = keyFiles.slice(0, 5);
        for (const filePath of filesToAnalyze) {
            try {
                this.reportProgress((fileAnalyses.length / filesToAnalyze.length) * 100, `分析文件: ${filePath}`);
                let fileContent = await this.readProjectFile(filePath);
                if (fileContent.length > 10000) {
                    // 如果文件太大，只分析前面部分
                    fileContent = fileContent.substring(0, 10000) + '\n// ... 文件内容已截断';
                }
                const prompt = this.buildPrompt('file-analysis', {
                    filePath,
                    fileContent,
                    framework: projectInfo.framework || 'unknown',
                    currentVersion: projectInfo.currentVersion || 'unknown',
                    targetVersion: 'latest'
                });
                const response = await this.analyzeWithAI(prompt, {
                    type: 'file-analysis',
                    fileName: filePath
                });
                const analysis = this.parseJSONResponse(response);
                fileAnalyses.push({
                    filePath,
                    analysis: analysis || { rawResponse: response }
                });
                this.updateFileStatus(filePath, 'analyzed');
            }
            catch (error) {
                this.logError(`文件分析失败: ${filePath}`, error);
                fileAnalyses.push({
                    filePath,
                    error: error.message
                });
            }
        }
        return {
            totalFiles: keyFiles.length,
            analyzedFiles: fileAnalyses.length,
            analyses: fileAnalyses
        };
    }
    identifyKeyFiles(fileList) {
        const keyPatterns = [
            /^src\/main\.(js|ts)$/,
            /^src\/App\.(vue|jsx|tsx)$/,
            /^src\/index\.(js|ts)$/,
            /package\.json$/,
            /webpack\.config\.(js|ts)$/,
            /vite\.config\.(js|ts)$/,
            /babel\.config\.(js|json)$/,
            /tsconfig\.json$/,
            /\.eslintrc\.(js|json)$/
        ];
        const keyFiles = fileList.filter(file => keyPatterns.some(pattern => pattern.test(file)));
        // 添加一些常见的组件文件
        const componentFiles = fileList.filter(file => file.endsWith('.vue') ||
            file.endsWith('.jsx') ||
            file.endsWith('.tsx')).slice(0, 10); // 限制数量
        return [...keyFiles, ...componentFiles];
    }
    async analyzeSpecificFile(filePath) {
        try {
            const fileContent = await this.readProjectFile(filePath);
            const prompt = this.buildPrompt('file-analysis', {
                filePath,
                fileContent,
                framework: this.context.project.framework || 'unknown',
                currentVersion: this.context.project.version || 'unknown',
                targetVersion: 'latest'
            });
            const response = await this.analyzeWithAI(prompt, {
                type: 'file-analysis',
                fileName: filePath
            });
            return this.parseJSONResponse(response);
        }
        catch (error) {
            this.logError(`单文件分析失败: ${filePath}`, error);
            throw error;
        }
    }
    async generateMigrationReport() {
        const summary = this.context.getSummary();
        const analysisResult = this.context.phases.results.analysis;
        return {
            summary,
            analysis: analysisResult,
            recommendations: this.generateRecommendations(analysisResult),
            nextSteps: this.generateNextSteps(analysisResult),
            timestamp: new Date().toISOString()
        };
    }
    generateRecommendations(analysisResult) {
        const recommendations = [];
        if (analysisResult?.analysis?.complexity === 'high') {
            recommendations.push('建议分阶段进行迁移，降低风险');
        }
        if (analysisResult?.dependencyAnalysis?.incompatible?.length > 0) {
            recommendations.push('优先处理不兼容的依赖');
        }
        if (analysisResult?.fileAnalysis?.analyses?.some((a) => a.analysis?.complexity === 'high')) {
            recommendations.push('对复杂文件进行人工审查');
        }
        return recommendations;
    }
    generateNextSteps(analysisResult) {
        const steps = [];
        steps.push('1. 创建项目备份');
        steps.push('2. 升级依赖包');
        if (analysisResult?.analysis?.complexity !== 'low') {
            steps.push('3. 使用AI辅助修复代码');
        }
        steps.push('4. 运行构建验证');
        steps.push('5. 执行测试验证');
        return steps;
    }
}
exports.AnalysisAgent = AnalysisAgent;
//# sourceMappingURL=AnalysisAgent.js.map