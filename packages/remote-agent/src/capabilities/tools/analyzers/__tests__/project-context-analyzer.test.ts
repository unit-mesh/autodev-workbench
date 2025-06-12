import { ProjectContextAnalyzer } from '../project-context-analyzer';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('ProjectContextAnalyzer', () => {
  let analyzer: ProjectContextAnalyzer;
  let projectRootPath: string;

  beforeEach(() => {
    analyzer = new ProjectContextAnalyzer();
    // 使用当前项目根目录作为测试项目
    projectRootPath = path.resolve(__dirname, '../../../../../..');
  });

  describe('getDetailedInsights', () => {
    it('should generate detailed insights for real project', async () => {
      const insights = await analyzer.getDetailedInsights(projectRootPath);

      // 验证详细洞察结构
      expect(insights).toHaveProperty('categorized_insights');
      expect(insights).toHaveProperty('actionable_recommendations');
      expect(insights).toHaveProperty('priority_recommendations');
      expect(insights).toHaveProperty('health_score');

      // 验证分类洞察
      expect(typeof insights.categorized_insights).toBe('object');

      // 验证可行性建议
      expect(Array.isArray(insights.actionable_recommendations)).toBe(true);

      // 验证优先级建议
      expect(insights.priority_recommendations).toHaveProperty('high');
      expect(insights.priority_recommendations).toHaveProperty('medium');
      expect(insights.priority_recommendations).toHaveProperty('low');
      expect(Array.isArray(insights.priority_recommendations.high)).toBe(true);
      expect(Array.isArray(insights.priority_recommendations.medium)).toBe(true);
      expect(Array.isArray(insights.priority_recommendations.low)).toBe(true);

      // 验证健康评分
      expect(typeof insights.health_score).toBe('number');
      expect(insights.health_score).toBeGreaterThanOrEqual(0);
      expect(insights.health_score).toBeLessThanOrEqual(100);
    }, 30000);
  });

  describe('workflow analysis', () => {
    it('should calculate automation score', async () => {
      const result = await analyzer.analyze(projectRootPath, 'full');

      expect(typeof result.workflow_analysis!.automation_score).toBe('number');
      expect(result.workflow_analysis!.automation_score).toBeGreaterThanOrEqual(0);
      expect(result.workflow_analysis!.automation_score).toBeLessThanOrEqual(100);
    }, 15000);
  });

  describe('architecture analysis', () => {
    it('should detect component-based architecture if components exist', async () => {
      const result = await analyzer.analyze(projectRootPath, 'full');

      const hasComponents = result.architecture_analysis!.directory_structure.includes('components');
      expect(result.architecture_analysis!.patterns.component_based).toBe(hasComponents);
    }, 15000);
  });

  describe('edge cases and error handling', () => {
    it('should handle relative paths correctly', async () => {
      const relativePath = './';
      const result = await analyzer.analyze(relativePath, 'basic');

      expect(result.analysis.workspace_path).toBe(relativePath);
      expect(result.analysis.resolved_path).toBe(path.resolve(relativePath));
    }, 10000);

    it('should handle different cache keys for different scopes', async () => {
      const basicResult = await analyzer.analyze(projectRootPath, 'basic');
      const fullResult = await analyzer.analyze(projectRootPath, 'full');

      // 基本分析和全量分析应该产生不同的结果
      expect(basicResult.analysis.analysis_scope).toBe('basic');
      expect(fullResult.analysis.analysis_scope).toBe('full');
      expect(basicResult.workflow_analysis).toBeUndefined();
      expect(fullResult.workflow_analysis).toBeDefined();
    }, 20000);
  });

  describe('performance', () => {
    it('should complete basic analysis within reasonable time', async () => {
      const startTime = Date.now();
      await analyzer.analyze(projectRootPath, 'basic');
      const duration = Date.now() - startTime;

      // 基本分析应该在 15 秒内完成
      expect(duration).toBeLessThan(15000);
    }, 16000);

    it('should complete full analysis within reasonable time', async () => {
      const startTime = Date.now();
      await analyzer.analyze(projectRootPath, 'full');
      const duration = Date.now() - startTime;

      // 全量分析应该在 30 秒内完成
      expect(duration).toBeLessThan(30000);
    }, 31000);
  });
});
