/**
 * 默认配置
 */

import { MigrationConfig } from '../types';

export const defaultConfig: MigrationConfig = {
  mode: 'auto',
  dryRun: false,
  verbose: false,
  maxRetries: 3,
  
  ai: {
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.1,
    timeout: 60000
  },
  
  execution: {
    parallelism: {
      enabled: true,
      maxConcurrency: 4,
      fileThreshold: 10
    },
    backup: {
      enabled: true,
      location: '.migration-backup',
      compression: false
    },
    rollback: {
      enabled: true,
      checkpoints: true,
      maxCheckpoints: 5
    }
  },
  
  validation: {
    build: {
      enabled: true,
      command: 'npm run build',
      timeout: 300000,
      retries: 3
    },
    tests: {
      enabled: false,
      command: 'npm test',
      timeout: 600000
    },
    linting: {
      enabled: true,
      command: 'npm run lint',
      autoFix: true
    }
  },
  
  logging: {
    level: 'info',
    outputs: ['console'],
    ai: {
      enabled: true,
      logPrompts: false,
      logResponses: false,
      logStats: true
    }
  },
  
  reporting: {
    enabled: true,
    formats: ['json'],
    outputDir: 'migration-reports',
    includeStats: true,
    includeLogs: false,
    includeRecommendations: true
  }
};

export const presetConfigs = {
  'vue2-to-vue3': {
    ...defaultConfig,
    source: {
      framework: 'vue',
      version: '2.x'
    },
    target: {
      framework: 'vue',
      version: '3.x'
    }
  },
  
  'react16-to-react18': {
    ...defaultConfig,
    source: {
      framework: 'react',
      version: '16.x'
    },
    target: {
      framework: 'react',
      version: '18.x'
    }
  },
  
  'angular12-to-angular15': {
    ...defaultConfig,
    source: {
      framework: 'angular',
      version: '12.x'
    },
    target: {
      framework: 'angular',
      version: '15.x'
    }
  }
};
