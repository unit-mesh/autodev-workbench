import { z } from 'zod';

// Project configuration schema
export const ProjectConfigSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
  type: z.enum(['microservice', 'monolith', 'library']),
  language: z.enum(['java', 'typescript', 'python', 'go', 'csharp']),
  framework: z.string().min(1, 'Framework is required'),
});

// Features schema
export const FeaturesSchema = z.array(z.string());

// Structure schema
export const StructureSchema = z.object({
  directories: z.array(z.string()),
  files: z.array(z.string()),
});

// Dependencies schema
export const DependenciesSchema = z.record(z.string(), z.string());

// Configurations schema
export const ConfigurationsSchema = z.record(z.string(), z.array(z.string()));

// Main project schema
export const ProjectSchema = z.object({
  projectConfig: ProjectConfigSchema,
  features: FeaturesSchema,
  structure: StructureSchema,
  dependencies: DependenciesSchema,
  configurations: ConfigurationsSchema,
});

// TypeScript types
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Features = z.infer<typeof FeaturesSchema>;
export type Structure = z.infer<typeof StructureSchema>;
export type Dependencies = z.infer<typeof DependenciesSchema>;
export type Configurations = z.infer<typeof ConfigurationsSchema>;
export type Project = z.infer<typeof ProjectSchema>;

// Supported project types
export const PROJECT_TYPES = ['microservice', 'monolith', 'library'] as const;
export const LANGUAGES = ['java', 'typescript', 'python', 'go', 'csharp'] as const;

// Common features
export const COMMON_FEATURES = [
  'authentication-authorization',
  'database-integration',
  'api-documentation',
  'data-validation',
  'docker-support',
  'ci-cd-pipeline',
  'testing-framework',
  'logging-system',
  'monitoring-metrics',
  'caching',
  'message-queue',
  'file-upload',
  'email-service',
  'notification-service',
] as const; 