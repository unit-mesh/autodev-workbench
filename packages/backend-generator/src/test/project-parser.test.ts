import { describe, it, expect } from 'vitest';
import { ProjectParser, ProjectParseError } from '../parser/project-parser.js';
import { Project } from '../types/project-config.js';

describe('ProjectParser', () => {
  const validProjectData: Project = {
    projectConfig: {
      name: 'test-project',
      description: 'A test project',
      type: 'microservice',
      language: 'java',
      framework: 'spring3',
    },
    features: ['authentication-authorization', 'database-integration'],
    structure: {
      directories: ['src/main/java', 'src/test/java'],
      files: ['pom.xml', 'README.md'],
    },
    dependencies: {
      'spring-boot-starter': '3.0.0',
      'spring-boot-starter-web': '3.0.0',
    },
    configurations: {
      'application.properties': [
        'server.port=8080',
        'spring.application.name=test-project',
      ],
    },
  };

  describe('parseFromJson', () => {
    it('should parse valid JSON string', () => {
      const jsonString = JSON.stringify(validProjectData);
      const result = ProjectParser.parseFromJson(jsonString);
      expect(result).toEqual(validProjectData);
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      expect(() => ProjectParser.parseFromJson(invalidJson)).toThrow(ProjectParseError);
    });
  });

  describe('parseFromObject', () => {
    it('should parse valid project object', () => {
      const result = ProjectParser.parseFromObject(validProjectData);
      expect(result).toEqual(validProjectData);
    });

    it('should throw error for missing required fields', () => {
      const invalidData = { 
        ...validProjectData,
        projectConfig: {
          ...validProjectData.projectConfig,
          name: undefined as any
        }
      };
      delete invalidData.projectConfig.name;
      
      expect(() => ProjectParser.parseFromObject(invalidData)).toThrow(ProjectParseError);
    });

    it('should throw error for invalid project type', () => {
      const invalidData = {
        ...validProjectData,
        projectConfig: {
          ...validProjectData.projectConfig,
          type: 'invalid-type' as any,
        },
      };
      
      expect(() => ProjectParser.parseFromObject(invalidData)).toThrow(ProjectParseError);
    });

    it('should throw error for invalid language', () => {
      const invalidData = {
        ...validProjectData,
        projectConfig: {
          ...validProjectData.projectConfig,
          language: 'invalid-language' as any,
        },
      };
      
      expect(() => ProjectParser.parseFromObject(invalidData)).toThrow(ProjectParseError);
    });
  });

  describe('validate', () => {
    it('should return success for valid data', () => {
      const result = ProjectParser.validate(validProjectData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validProjectData);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid data', () => {
      const invalidData = { 
        ...validProjectData,
        projectConfig: undefined as any
      };
      delete invalidData.projectConfig;
      
      const result = ProjectParser.validate(invalidData);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });
}); 