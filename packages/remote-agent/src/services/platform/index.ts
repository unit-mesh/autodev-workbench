/**
 * Platform Services Module
 * 
 * Provides unified interface for multiple issue tracking platforms
 * (GitHub, GitLab, Jira, Azure DevOps, Bitbucket)
 */

// Core interfaces and types
export * from './interfaces/IPlatformService';

// Base classes
export { BasePlatformService } from './base/BasePlatformService';

// Factory
export { PlatformServiceFactory } from './factories/PlatformServiceFactory';

// Implementations
export { GitHubPlatformService } from './implementations/GitHubPlatformService';
export { GitLabPlatformService } from './implementations/GitLabPlatformService';
export { JiraPlatformService } from './implementations/JiraPlatformService';
export { AzureDevOpsPlatformService } from './implementations/AzureDevOpsPlatformService';
export { BitbucketPlatformService } from './implementations/BitbucketPlatformService';

// Convenience functions
export async function createPlatformService(platformType?: string) {
  const { PlatformServiceFactory } = await import('./factories/PlatformServiceFactory');
  return PlatformServiceFactory.createFromEnv(platformType as any);
}

export function getSupportedPlatforms() {
  return ['github', 'gitlab', 'jira', 'azure-devops', 'bitbucket'] as const;
}
