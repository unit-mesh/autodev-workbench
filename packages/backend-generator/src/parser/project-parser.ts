import { Project, ProjectSchema } from '../types/project-config.js';
import { ZodError } from 'zod';
import * as fs from 'fs-extra';

export class ProjectParseError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ProjectParseError';
  }
}

export class ProjectParser {
  /**
   * Parse a JSON string into a Project object
   */
  static parseFromJson(jsonString: string): Project {
    try {
      const data = JSON.parse(jsonString);
      return this.parseFromObject(data);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ProjectParseError('Invalid JSON format', error.message);
      }
      throw error;
    }
  }

  /**
   * Parse a plain object into a Project object
   */
  static parseFromObject(data: any): Project {
    try {
      return ProjectSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new ProjectParseError(`Validation failed: ${errorMessages}`, error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate a project configuration without throwing
   */
  static validate(data: any): { success: boolean; error?: string; data?: Project } {
    try {
      const project = this.parseFromObject(data);
      return { success: true, data: project };
    } catch (error) {
      if (error instanceof ProjectParseError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Unknown validation error' };
    }
  }

  /**
   * Parse project configuration from a file
   */
  static async parseFromFile(filePath: string): Promise<Project> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseFromJson(content);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new ProjectParseError(`File not found: ${filePath}`);
      }
      throw error;
    }
  }
} 