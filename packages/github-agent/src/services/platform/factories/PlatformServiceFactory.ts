/**
 * Platform Service Factory
 * 
 * Creates appropriate platform service instances based on configuration
 */

import { 
  IPlatformService, 
  PlatformConfig, 
  PlatformType 
} from '../interfaces/IPlatformService';

export class PlatformServiceFactory {
  private static instances = new Map<string, IPlatformService>();

  /**
   * Create a platform service instance
   */
  static async create(config: PlatformConfig): Promise<IPlatformService> {
    const cacheKey = `${config.type}-${config.baseUrl || 'default'}`;
    
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    let service: IPlatformService;

    switch (config.type) {
      case 'github':
        const { GitHubPlatformService } = await import('../implementations/GitHubPlatformService');
        service = new GitHubPlatformService(config);
        break;
        
      case 'gitlab':
        const { GitLabPlatformService } = await import('../implementations/GitLabPlatformService');
        service = new GitLabPlatformService(config);
        break;
        
      case 'jira':
        const { JiraPlatformService } = await import('../implementations/JiraPlatformService');
        service = new JiraPlatformService(config);
        break;
        
      case 'azure-devops':
        const { AzureDevOpsPlatformService } = await import('../implementations/AzureDevOpsPlatformService');
        service = new AzureDevOpsPlatformService(config);
        break;
        
      case 'bitbucket':
        const { BitbucketPlatformService } = await import('../implementations/BitbucketPlatformService');
        service = new BitbucketPlatformService(config);
        break;
        
      default:
        throw new Error(`Unsupported platform type: ${config.type}`);
    }

    this.instances.set(cacheKey, service);
    return service;
  }

  /**
   * Create service from environment variables
   */
  static async createFromEnv(platformType?: PlatformType): Promise<IPlatformService> {
    const type = platformType || this.detectPlatformFromEnv();
    const config = this.buildConfigFromEnv(type);
    return this.create(config);
  }

  /**
   * Detect platform type from environment variables
   */
  private static detectPlatformFromEnv(): PlatformType {
    if (process.env.GITHUB_TOKEN) return 'github';
    if (process.env.GITLAB_TOKEN) return 'gitlab';
    if (process.env.JIRA_TOKEN) return 'jira';
    if (process.env.AZURE_DEVOPS_TOKEN) return 'azure-devops';
    if (process.env.BITBUCKET_TOKEN) return 'bitbucket';
    
    // Default to GitHub for backward compatibility
    return 'github';
  }

  /**
   * Build configuration from environment variables
   */
  private static buildConfigFromEnv(type: PlatformType): PlatformConfig {
    const configs: Record<PlatformType, () => PlatformConfig> = {
      github: () => ({
        type: 'github',
        token: process.env.GITHUB_TOKEN || '',
        baseUrl: process.env.GITHUB_BASE_URL || 'https://api.github.com'
      }),
      
      gitlab: () => ({
        type: 'gitlab',
        token: process.env.GITLAB_TOKEN || '',
        baseUrl: process.env.GITLAB_BASE_URL || 'https://gitlab.com/api/v4'
      }),
      
      jira: () => ({
        type: 'jira',
        token: process.env.JIRA_TOKEN || '',
        baseUrl: process.env.JIRA_BASE_URL || '',
        additionalConfig: {
          username: process.env.JIRA_USERNAME,
          domain: process.env.JIRA_DOMAIN
        }
      }),
      
      'azure-devops': () => ({
        type: 'azure-devops',
        token: process.env.AZURE_DEVOPS_TOKEN || '',
        baseUrl: process.env.AZURE_DEVOPS_BASE_URL || 'https://dev.azure.com',
        additionalConfig: {
          organization: process.env.AZURE_DEVOPS_ORG
        }
      }),
      
      bitbucket: () => ({
        type: 'bitbucket',
        token: process.env.BITBUCKET_TOKEN || '',
        baseUrl: process.env.BITBUCKET_BASE_URL || 'https://api.bitbucket.org/2.0'
      })
    };

    const config = configs[type]();
    
    if (!config.token) {
      throw new Error(`Missing token for platform ${type}. Please set the appropriate environment variable.`);
    }

    return config;
  }

  /**
   * Get supported platform types
   */
  static getSupportedPlatforms(): PlatformType[] {
    return ['github', 'gitlab', 'jira', 'azure-devops', 'bitbucket'];
  }

  /**
   * Clear cached instances
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Check if a platform is supported
   */
  static isSupported(platformType: string): platformType is PlatformType {
    return this.getSupportedPlatforms().includes(platformType as PlatformType);
  }
}
