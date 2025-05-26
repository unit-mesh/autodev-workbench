import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectGenerator, ProjectGenerateError } from '../generator/project-generator.js';
import { Project } from '../types/project-config.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

describe('ProjectGenerator', () => {
  const testProject: Project = {
    projectConfig: {
      name: 'test-project',
      description: 'A test project for unit testing',
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

  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'backend-generator-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('generateJson', () => {
    it('should generate pretty JSON by default', () => {
      const json = ProjectGenerator.generateJson(testProject);
      expect(json).toContain('\n');
      expect(json).toContain('  ');
      expect(JSON.parse(json)).toEqual(testProject);
    });

    it('should generate compact JSON when pretty is false', () => {
      const json = ProjectGenerator.generateJson(testProject, false);
      expect(json).not.toContain('\n');
      expect(JSON.parse(json)).toEqual(testProject);
    });
  });

  describe('saveToFile', () => {
    it('should save project to file', async () => {
      const filePath = path.join(tempDir, 'test-config.json');
      await ProjectGenerator.saveToFile(testProject, filePath);
      
      expect(await fs.pathExists(filePath)).toBe(true);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(testProject);
    });

    it('should create directory if it does not exist', async () => {
      const filePath = path.join(tempDir, 'nested', 'dir', 'test-config.json');
      await ProjectGenerator.saveToFile(testProject, filePath);
      
      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('generate', () => {
    it('should generate project structure in dry run mode', async () => {
      const generator = new ProjectGenerator(testProject, {
        outputDir: tempDir,
        dryRun: true,
      });

      await generator.generate();

      // In dry run mode, no files should be created
      const files = await fs.readdir(tempDir);
      expect(files).toHaveLength(0);
    });

    it('should generate project structure', async () => {
      const outputDir = path.join(tempDir, 'output');
      const generator = new ProjectGenerator(testProject, {
        outputDir,
      });

      await generator.generate();

      // Check directories
      for (const dir of testProject.structure.directories) {
        const dirPath = path.join(outputDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const stat = await fs.stat(dirPath);
        expect(stat.isDirectory()).toBe(true);
      }

      // Check configuration files
      for (const [fileName] of Object.entries(testProject.configurations)) {
        const filePath = path.join(outputDir, fileName);
        expect(await fs.pathExists(filePath)).toBe(true);
      }
    });

    it('should throw error when output directory is not empty and overwrite is false', async () => {
      // Create a file in the output directory
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, 'existing-file.txt'), 'content');

      const generator = new ProjectGenerator(testProject, {
        outputDir: tempDir,
        overwrite: false,
      });

      await expect(generator.generate()).rejects.toThrow(ProjectGenerateError);
    });

    it('should overwrite existing files when overwrite is true', async () => {
      // Create a file in the output directory
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, 'existing-file.txt'), 'content');

      const generator = new ProjectGenerator(testProject, {
        outputDir: tempDir,
        overwrite: true,
      });

      // Should not throw
      await expect(generator.generate()).resolves.not.toThrow();
    });
  });
}); 