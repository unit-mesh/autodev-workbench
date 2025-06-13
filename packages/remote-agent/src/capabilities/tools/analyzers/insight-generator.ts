import { AnalysisResult } from "./project-context-analyzer";

export interface InsightRule {
  condition: (result: AnalysisResult) => boolean;
  message: string | ((result: AnalysisResult) => string);
  category: 'project' | 'codebase' | 'workflow' | 'architecture' | 'dependencies';
  priority: 'low' | 'medium' | 'high';
}

export interface RecommendationRule {
  condition: (result: AnalysisResult) => boolean;
  message: string | ((result: AnalysisResult) => string);
  category: 'documentation' | 'legal' | 'automation' | 'maintenance' | 'security';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export class InsightGenerator {
  private static readonly INSIGHT_RULES: InsightRule[] = [
    {
      condition: (result) => result.project_info?.type !== 'unknown',
      message: (result) => `Project is identified as a ${result.project_info.type} project`,
      category: 'project',
      priority: 'medium'
    },
    {
      condition: (result) => result.workflow_analysis?.automation_score > 80,
      message: "Excellent automation setup with comprehensive CI/CD and build scripts",
      category: 'workflow',
      priority: 'high'
    },
    {
      condition: (result) => result.workflow_analysis?.automation_score > 60,
      message: "Good automation setup with CI/CD and build scripts",
      category: 'workflow',
      priority: 'medium'
    },
    {
      condition: (result) => result.workflow_analysis?.automation_score < 20,
      message: "Minimal automation detected - consider improving development workflow",
      category: 'workflow',
      priority: 'high'
    },
    {
      condition: (result) => result.architecture_analysis?.patterns.monorepo,
      message: "Monorepo architecture detected - consider workspace management tools",
      category: 'architecture',
      priority: 'medium'
    },
    {
      condition: (result) => result.architecture_analysis?.patterns.microservices,
      message: "Microservices architecture pattern detected",
      category: 'architecture',
      priority: 'medium'
    },
    {
      condition: (result) => result.architecture_analysis?.patterns.mvc,
      message: "MVC architecture pattern detected - well-structured separation of concerns",
      category: 'architecture',
      priority: 'medium'
    },
    {
      condition: (result) => result.architecture_analysis?.complexity_score > 80,
      message: "High architectural complexity - consider refactoring for maintainability",
      category: 'architecture',
      priority: 'high'
    },
    {
      condition: (result) => result.dependencies_summary?.total_deps > 200,
      message: "Very large number of dependencies - high maintenance overhead",
      category: 'dependencies',
      priority: 'high'
    },
    {
      condition: (result) => result.dependencies_summary?.total_deps > 100,
      message: "Large number of dependencies - consider regular dependency audits",
      category: 'dependencies',
      priority: 'medium'
    }
  ];

  private static readonly RECOMMENDATION_RULES: RecommendationRule[] = [
    {
      condition: (result) => !result.project_info?.has_readme,
      message: "Consider adding a README.md file for project documentation",
      category: 'documentation',
      priority: 'high',
      actionable: true
    },
    {
      condition: (result) => !result.project_info?.has_license,
      message: "Consider adding a LICENSE file to clarify usage rights",
      category: 'legal',
      priority: 'medium',
      actionable: true
    },
    {
      condition: (result) => !result.project_info?.has_changelog,
      message: "Consider adding a CHANGELOG.md to track project changes",
      category: 'documentation',
      priority: 'low',
      actionable: true
    },
    {
      condition: (result) => result.workflow_analysis?.automation_score < 30,
      message: "Low automation score - consider adding CI/CD workflows and build scripts",
      category: 'automation',
      priority: 'high',
      actionable: true
    },
    {
      condition: (result) => !result.workflow_analysis?.has_docker && result.project_info?.type === 'Node.js/JavaScript',
      message: "Consider adding Docker support for consistent deployment",
      category: 'automation',
      priority: 'medium',
      actionable: true
    },
    {
      condition: (result) => result.dependencies_summary?.total_deps > 100,
      message: "Large number of dependencies - consider dependency audit and cleanup",
      category: 'maintenance',
      priority: 'medium',
      actionable: true
    },
    {
      condition: (result) => result.dependencies_summary?.total_deps > 200,
      message: "Very large dependency count - implement automated dependency monitoring",
      category: 'security',
      priority: 'high',
      actionable: true
    },
    {
      condition: (result) => !result.git_info?.has_gitignore,
      message: "Add .gitignore file to exclude unnecessary files from version control",
      category: 'maintenance',
      priority: 'medium',
      actionable: true
    },
    {
      condition: (result) => result.architecture_analysis?.complexity_score > 80,
      message: "High complexity - consider architectural refactoring and documentation",
      category: 'maintenance',
      priority: 'high',
      actionable: true
    }
  ];

  generateInsights(result: AnalysisResult): string[] {
    return InsightGenerator.INSIGHT_RULES
      .filter(rule => rule.condition(result))
      .sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority))
      .map(rule => typeof rule.message === 'function' ? rule.message(result) : rule.message);
  }

  generateRecommendations(result: AnalysisResult): string[] {
    return InsightGenerator.RECOMMENDATION_RULES
      .filter(rule => rule.condition(result))
      .sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority))
      .map(rule => typeof rule.message === 'function' ? rule.message(result) : rule.message);
  }

  generateCategorizedInsights(result: AnalysisResult): Record<string, string[]> {
    const categorized: Record<string, string[]> = {};

    InsightGenerator.INSIGHT_RULES
      .filter(rule => rule.condition(result))
      .forEach(rule => {
        if (!categorized[rule.category]) {
          categorized[rule.category] = [];
        }
        const message = typeof rule.message === 'function' ? rule.message(result) : rule.message;
        categorized[rule.category].push(message);
      });

    return categorized;
  }

  generateActionableRecommendations(result: AnalysisResult): string[] {
    return InsightGenerator.RECOMMENDATION_RULES
      .filter(rule => rule.condition(result) && rule.actionable)
      .sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority))
      .map(rule => typeof rule.message === 'function' ? rule.message(result) : rule.message);
  }

  generatePriorityRecommendations(result: AnalysisResult, priority: 'low' | 'medium' | 'high'): string[] {
    return InsightGenerator.RECOMMENDATION_RULES
      .filter(rule => rule.condition(result) && rule.priority === priority)
      .map(rule => typeof rule.message === 'function' ? rule.message(result) : rule.message);
  }

  getProjectHealthScore(result: AnalysisResult): number {
    let score = 50; // Base score

    // Documentation score (0-20 points)
    if (result.project_info?.has_readme) score += 8;
    if (result.project_info?.has_license) score += 5;
    if (result.project_info?.has_changelog) score += 3;

    // Automation score (0-20 points)
    if (result.workflow_analysis?.automation_score) {
      score += Math.round(result.workflow_analysis.automation_score * 0.2);
    }

    // Architecture score (0-15 points)
    if (result.architecture_analysis?.complexity_score < 50) score += 10;
    else if (result.architecture_analysis?.complexity_score < 80) score += 5;

    if (result.architecture_analysis?.patterns.layered) score += 3;
    if (result.architecture_analysis?.patterns.component_based) score += 2;

    // Dependency management (0-10 points)
    if (result.dependencies_summary?.total_deps < 50) score += 6;
    else if (result.dependencies_summary?.total_deps < 100) score += 4;
    else if (result.dependencies_summary?.total_deps < 200) score += 2;

    return Math.min(100, Math.max(0, score));
  }

  private priorityWeight(priority: 'low' | 'medium' | 'high'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
}
