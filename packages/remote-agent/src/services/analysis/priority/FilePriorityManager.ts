import { GitHubIssue } from '../../../types';
import { SearchKeywords } from '../interfaces/IAnalysisStrategy';

export interface FilePriorityRule {
  pattern: RegExp | string;
  score: number;
  reason: string;
  categories: string[];
  conditions?: (issue: GitHubIssue, filePath: string) => boolean;
}

export interface PriorityCategory {
  name: string;
  description: string;
  rules: FilePriorityRule[];
  weight: number; // Category importance multiplier
}

export interface FilePriorityResult {
  filePath: string;
  score: number;
  matchedRules: Array<{
    rule: FilePriorityRule;
    category: string;
    adjustedScore: number;
  }>;
  reason: string;
}

/**
 * Comprehensive file priority management system
 * Handles different types of issues with specialized priority rules
 */
export class FilePriorityManager {
  private categories: Map<string, PriorityCategory> = new Map();

  constructor() {
    this.initializeCategories();
  }

  /**
   * Calculate priority score for a file based on issue context
   */
  calculatePriority(
    filePath: string,
    issue: GitHubIssue,
    keywords: SearchKeywords,
    llmPriorities?: Array<{ pattern: string; score: number; reason: string }>
  ): FilePriorityResult {
    const result: FilePriorityResult = {
      filePath,
      score: 0,
      matchedRules: [],
      reason: ''
    };

    // 1. Apply LLM-suggested priorities first (highest weight)
    if (llmPriorities) {
      for (const llmPriority of llmPriorities) {
        if (this.matchesPattern(filePath, llmPriority.pattern)) {
          result.score = Math.max(result.score, llmPriority.score);
          result.matchedRules.push({
            rule: {
              pattern: llmPriority.pattern,
              score: llmPriority.score,
              reason: llmPriority.reason,
              categories: ['llm-suggested']
            },
            category: 'llm-suggested',
            adjustedScore: llmPriority.score
          });
        }
      }
    }

    // 2. Apply category-based rules
    const issueType = this.detectIssueType(issue);
    const relevantCategories = this.getRelevantCategories(issueType, keywords);

    for (const categoryName of relevantCategories) {
      const category = this.categories.get(categoryName);
      if (!category) continue;

      for (const rule of category.rules) {
        if (this.matchesRule(filePath, rule, issue)) {
          const adjustedScore = rule.score * category.weight;
          result.score = Math.max(result.score, adjustedScore);
          result.matchedRules.push({
            rule,
            category: categoryName,
            adjustedScore
          });
        }
      }
    }

    // 3. Generate comprehensive reason
    result.reason = this.generateReason(result.matchedRules);

    return result;
  }

  /**
   * Get files that should be skipped from LLM analysis
   */
  shouldSkipLLMAnalysis(filePath: string, priorityScore: number, issue?: GitHubIssue): boolean {
    // Skip files with very low priority scores
    if (priorityScore < 3) return true;

    // For documentation-related issues, don't skip documentation files
    const isDocumentationIssue = issue && this.isDocumentationIssue(issue);

    // Skip certain file types that are unlikely to be relevant
    const skipPatterns = [
      /\.test\.(ts|js|tsx|jsx)$/,
      /\.spec\.(ts|js|tsx|jsx)$/,
      /\/tests?\//,
      /\/examples?\//,
      /\/coverage\//,
      /\/node_modules\//,
      /\/dist\//,
      /\/build\//,
      /\.(log|tmp|cache)$/
    ];

    // Only skip documentation files if it's NOT a documentation issue
    if (!isDocumentationIssue) {
      skipPatterns.push(
        /\.(md|txt|json|yaml|yml)$/,
        /\/docs?\//
      );
    }

    return skipPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if the issue is related to documentation
   */
  private isDocumentationIssue(issue: GitHubIssue): boolean {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const docKeywords = [
      'docs', 'documentation', 'readme', 'guide', 'tutorial',
      'architecture', 'diagram', 'document', 'manual'
    ];

    const hasDocKeywords = docKeywords.some(keyword => text.includes(keyword));
    const hasDocLabels = issue.labels.some(label => label.name.toLowerCase().includes('documentation'));

    return hasDocKeywords || hasDocLabels;
  }

  private initializeCategories(): void {
    // Database & Connection Issues
    this.categories.set('database', {
      name: 'Database & Connection',
      description: 'Database connection, ORM, and data persistence issues',
      weight: 1.2,
      rules: [
        {
          pattern: /prisma/i,
          score: 10,
          reason: 'Prisma ORM configuration and client',
          categories: ['database', 'orm'],
          conditions: (issue) => this.containsKeywords(issue, ['prisma', 'database', 'connection'])
        },
        {
          pattern: /database|db/i,
          score: 9,
          reason: 'Database configuration and utilities',
          categories: ['database']
        },
        {
          pattern: /connection|connect/i,
          score: 8,
          reason: 'Connection management and pooling',
          categories: ['database', 'network']
        },
        {
          pattern: /schema\.(ts|js|sql|prisma)$/i,
          score: 9,
          reason: 'Database schema definitions',
          categories: ['database', 'schema']
        },
        {
          pattern: /migration/i,
          score: 7,
          reason: 'Database migration files',
          categories: ['database', 'migration']
        }
      ]
    });

    // Authentication & Authorization
    this.categories.set('auth', {
      name: 'Authentication & Authorization',
      description: 'User authentication, session management, and access control',
      weight: 1.1,
      rules: [
        {
          pattern: /auth/i,
          score: 9,
          reason: 'Authentication logic and configuration',
          categories: ['auth']
        },
        {
          pattern: /login|signin|signup/i,
          score: 8,
          reason: 'User login and registration flows',
          categories: ['auth', 'user']
        },
        {
          pattern: /session|token|jwt/i,
          score: 8,
          reason: 'Session and token management',
          categories: ['auth', 'security']
        },
        {
          pattern: /middleware.*auth/i,
          score: 8,
          reason: 'Authentication middleware',
          categories: ['auth', 'middleware']
        },
        {
          pattern: /provider|oauth/i,
          score: 7,
          reason: 'OAuth and authentication providers',
          categories: ['auth', 'oauth']
        }
      ]
    });

    // API & Network Issues
    this.categories.set('api', {
      name: 'API & Network',
      description: 'REST APIs, GraphQL, and network communication',
      weight: 1.0,
      rules: [
        {
          pattern: /api|endpoint/i,
          score: 8,
          reason: 'API endpoints and handlers',
          categories: ['api']
        },
        {
          pattern: /route|router/i,
          score: 7,
          reason: 'Routing configuration and handlers',
          categories: ['api', 'routing']
        },
        {
          pattern: /controller/i,
          score: 7,
          reason: 'API controllers and business logic',
          categories: ['api', 'controller']
        },
        {
          pattern: /middleware/i,
          score: 6,
          reason: 'Request/response middleware',
          categories: ['api', 'middleware']
        },
        {
          pattern: /graphql|gql/i,
          score: 7,
          reason: 'GraphQL schema and resolvers',
          categories: ['api', 'graphql']
        }
      ]
    });

    // Configuration & Environment
    this.categories.set('config', {
      name: 'Configuration & Environment',
      description: 'Application configuration, environment variables, and settings',
      weight: 0.9,
      rules: [
        {
          pattern: /config/i,
          score: 7,
          reason: 'Configuration files and settings',
          categories: ['config']
        },
        {
          pattern: /\.env|environment/i,
          score: 8,
          reason: 'Environment variables and configuration',
          categories: ['config', 'environment']
        },
        {
          pattern: /settings|options/i,
          score: 6,
          reason: 'Application settings and options',
          categories: ['config']
        },
        {
          pattern: /package\.json|tsconfig|webpack|vite/i,
          score: 5,
          reason: 'Build and dependency configuration',
          categories: ['config', 'build']
        }
      ]
    });

    // Error Handling & Logging
    this.categories.set('error', {
      name: 'Error Handling & Logging',
      description: 'Error handling, logging, and debugging utilities',
      weight: 1.0,
      rules: [
        {
          pattern: /error|exception/i,
          score: 8,
          reason: 'Error handling and exception management',
          categories: ['error']
        },
        {
          pattern: /log|logger/i,
          score: 6,
          reason: 'Logging configuration and utilities',
          categories: ['logging']
        },
        {
          pattern: /debug|trace/i,
          score: 5,
          reason: 'Debugging and tracing utilities',
          categories: ['debug']
        },
        {
          pattern: /handler.*error|catch/i,
          score: 7,
          reason: 'Error handling logic',
          categories: ['error', 'handler']
        }
      ]
    });

    // Frontend & UI Issues
    this.categories.set('frontend', {
      name: 'Frontend & UI',
      description: 'React components, UI logic, and frontend functionality',
      weight: 0.8,
      rules: [
        {
          pattern: /component|ui/i,
          score: 6,
          reason: 'UI components and interface logic',
          categories: ['frontend', 'ui']
        },
        {
          pattern: /page|view/i,
          score: 5,
          reason: 'Page components and views',
          categories: ['frontend', 'page']
        },
        {
          pattern: /hook|use[A-Z]/,
          score: 6,
          reason: 'React hooks and state management',
          categories: ['frontend', 'react']
        },
        {
          pattern: /style|css|scss/i,
          score: 4,
          reason: 'Styling and CSS files',
          categories: ['frontend', 'style']
        }
      ]
    });

    // Testing & Quality
    this.categories.set('testing', {
      name: 'Testing & Quality',
      description: 'Test files, quality assurance, and validation',
      weight: 0.6,
      rules: [
        {
          pattern: /test|spec/i,
          score: 4,
          reason: 'Test files and specifications',
          categories: ['testing']
        },
        {
          pattern: /mock|stub|fixture/i,
          score: 3,
          reason: 'Test mocks and fixtures',
          categories: ['testing', 'mock']
        },
        {
          pattern: /validate|validation/i,
          score: 5,
          reason: 'Data validation logic',
          categories: ['validation']
        }
      ]
    });
  }

  private detectIssueType(issue: GitHubIssue): string[] {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const types: string[] = [];

    // Database issues
    if (this.containsKeywords(issue, ['database', 'db', 'connection', 'prisma', 'sql', 'query', 'timeout'])) {
      types.push('database');
    }

    // Authentication issues
    if (this.containsKeywords(issue, ['auth', 'login', 'signin', 'token', 'session', 'oauth', 'provider'])) {
      types.push('auth');
    }

    // API issues
    if (this.containsKeywords(issue, ['api', 'endpoint', 'route', 'request', 'response', 'http', 'rest'])) {
      types.push('api');
    }

    // Configuration issues
    if (this.containsKeywords(issue, ['config', 'environment', 'env', 'settings', 'setup'])) {
      types.push('config');
    }

    // Error handling issues
    if (this.containsKeywords(issue, ['error', 'exception', 'crash', 'fail', 'bug', 'broken'])) {
      types.push('error');
    }

    // Frontend issues
    if (this.containsKeywords(issue, ['ui', 'component', 'react', 'frontend', 'page', 'view', 'render'])) {
      types.push('frontend');
    }

    // Performance issues
    if (this.containsKeywords(issue, ['performance', 'slow', 'timeout', 'memory', 'cpu', 'optimization'])) {
      types.push('performance');
    }

    // Testing issues
    if (this.containsKeywords(issue, ['test', 'testing', 'spec', 'unit', 'integration', 'e2e'])) {
      types.push('testing');
    }

    return types.length > 0 ? types : ['general'];
  }

  private getRelevantCategories(issueTypes: string[], keywords: SearchKeywords): string[] {
    const categories = new Set<string>();

    // Add categories based on detected issue types
    for (const type of issueTypes) {
      categories.add(type);
    }

    // Add categories based on keywords
    const allKeywords = [
      ...keywords.primary,
      ...keywords.secondary,
      ...keywords.tertiary
    ].map(k => k.toLowerCase());

    // Database keywords
    if (allKeywords.some(k => ['prisma', 'database', 'db', 'sql', 'connection'].includes(k))) {
      categories.add('database');
    }

    // Auth keywords
    if (allKeywords.some(k => ['auth', 'login', 'token', 'session', 'oauth'].includes(k))) {
      categories.add('auth');
    }

    // API keywords
    if (allKeywords.some(k => ['api', 'endpoint', 'route', 'controller', 'service'].includes(k))) {
      categories.add('api');
    }

    // Config keywords
    if (allKeywords.some(k => ['config', 'env', 'environment', 'settings'].includes(k))) {
      categories.add('config');
    }

    // Error keywords
    if (allKeywords.some(k => ['error', 'exception', 'handler', 'catch'].includes(k))) {
      categories.add('error');
    }

    // Always include general categories for broader coverage
    categories.add('config');
    categories.add('error');

    return Array.from(categories);
  }

  private containsKeywords(issue: GitHubIssue, keywords: string[]): boolean {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  private matchesPattern(filePath: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return filePath.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(filePath);
  }

  private matchesRule(filePath: string, rule: FilePriorityRule, issue: GitHubIssue): boolean {
    // Check pattern match
    if (!this.matchesPattern(filePath, rule.pattern)) {
      return false;
    }

    // Check additional conditions if present
    if (rule.conditions && !rule.conditions(issue, filePath)) {
      return false;
    }

    return true;
  }

  private generateReason(matchedRules: Array<{ rule: FilePriorityRule; category: string; adjustedScore: number }>): string {
    if (matchedRules.length === 0) {
      return 'No specific priority rules matched';
    }

    // Sort by adjusted score (highest first)
    const sortedRules = matchedRules.sort((a, b) => b.adjustedScore - a.adjustedScore);
    const topRule = sortedRules[0];

    let reason = topRule.rule.reason;

    // Add category context if multiple categories matched
    const categories = [...new Set(matchedRules.map(r => r.category))];
    if (categories.length > 1) {
      reason += ` (matches: ${categories.join(', ')})`;
    }

    // Add score context
    reason += ` [score: ${topRule.adjustedScore.toFixed(1)}]`;

    return reason;
  }

  /**
   * Get priority statistics for debugging
   */
  getPriorityStats(filePaths: string[], issue: GitHubIssue, keywords: SearchKeywords): {
    totalFiles: number;
    categorizedFiles: Map<string, number>;
    averageScore: number;
    highPriorityFiles: number;
  } {
    const stats = {
      totalFiles: filePaths.length,
      categorizedFiles: new Map<string, number>(),
      averageScore: 0,
      highPriorityFiles: 0
    };

    let totalScore = 0;

    for (const filePath of filePaths) {
      const priority = this.calculatePriority(filePath, issue, keywords);
      totalScore += priority.score;

      if (priority.score >= 7) {
        stats.highPriorityFiles++;
      }

      // Count categories
      for (const match of priority.matchedRules) {
        const count = stats.categorizedFiles.get(match.category) || 0;
        stats.categorizedFiles.set(match.category, count + 1);
      }
    }

    stats.averageScore = filePaths.length > 0 ? totalScore / filePaths.length : 0;

    return stats;
  }

  /**
   * Add custom priority rules for specific projects
   */
  addCustomRules(categoryName: string, rules: FilePriorityRule[]): void {
    const category = this.categories.get(categoryName);
    if (category) {
      category.rules.push(...rules);
    } else {
      this.categories.set(categoryName, {
        name: categoryName,
        description: 'Custom category',
        weight: 1.0,
        rules
      });
    }
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get detailed information about a category
   */
  getCategoryInfo(categoryName: string): PriorityCategory | undefined {
    return this.categories.get(categoryName);
  }
}
