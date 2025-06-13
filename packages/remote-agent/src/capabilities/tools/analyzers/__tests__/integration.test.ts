import { ProjectContextAnalyzer } from '../project-context-analyzer';
import * as path from 'path';

describe('ProjectContextAnalyzer Integration Tests', () => {
  let analyzer: ProjectContextAnalyzer;
  const projectRoot = path.resolve(__dirname, '../../../../../..');

  beforeEach(() => {
    analyzer = new ProjectContextAnalyzer();
  });

  test('analyze current project - basic scope', async () => {
    const result = await analyzer.analyze(projectRoot, 'basic');

    // 基本验证
    expect(result.analysis.workspace_path).toBe(projectRoot);
    expect(result.project_info.name).toBeDefined();
    expect(result.insights).toBeInstanceOf(Array);
    expect(result.recommendations).toBeInstanceOf(Array);

    console.log('Project Info:', {
      name: result.project_info.name,
      type: result.project_info.type
    });
  });

  test('analyze current project - full scope', async () => {
    const result = await analyzer.analyze(projectRoot, 'full');

    // 全面验证
    expect(result.workflow_analysis).toBeDefined();
    expect(result.architecture_analysis).toBeDefined();
    expect(result.git_info).toBeDefined();
    expect(result.health_score).toBeGreaterThanOrEqual(0);

    console.log('Full Analysis:', {
      healthScore: result.health_score,
      isMonorepo: result.architecture_analysis?.patterns.monorepo,
      cicdPlatforms: result.workflow_analysis?.cicd_platforms,
      isGitRepo: result.git_info?.is_git_repo
    });
  });

  test('detailed insights generation', async () => {
    const insights = await analyzer.getDetailedInsights(projectRoot);

    expect(insights.health_score).toBeGreaterThanOrEqual(0);
    expect(insights.categorized_insights).toBeDefined();
    expect(insights.actionable_recommendations).toBeInstanceOf(Array);
    expect(insights.priority_recommendations.high).toBeInstanceOf(Array);

    console.log('Detailed Insights:', {
      healthScore: insights.health_score,
      categoriesCount: Object.keys(insights.categorized_insights).length,
      recommendationsCount: insights.actionable_recommendations.length,
      highPriorityCount: insights.priority_recommendations.high.length
    });
  });
});
