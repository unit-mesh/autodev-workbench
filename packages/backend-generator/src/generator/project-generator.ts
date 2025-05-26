import { Project } from '../types/project-config.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';

export interface GeneratorOptions {
  outputDir: string;
  overwrite?: boolean;
  dryRun?: boolean;
}

export class ProjectGenerateError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ProjectGenerateError';
  }
}

export class ProjectGenerator {
  private project: Project;
  private options: GeneratorOptions;

  constructor(project: Project, options: GeneratorOptions) {
    this.project = project;
    this.options = options;
  }

  /**
   * Generate the complete project structure
   */
  async generate(): Promise<void> {
    try {
      await this.validateOptions();
      await this.createDirectories();
      await this.generateFiles();
      await this.generateConfigurationFiles();
    } catch (error) {
      if (error instanceof Error) {
        throw new ProjectGenerateError(`Generation failed: ${error.message}`, error);
      }
      throw error;
    }
  }

  /**
   * Generate project configuration as JSON
   */
  static generateJson(project: Project, pretty: boolean = true): string {
    return JSON.stringify(project, null, pretty ? 2 : 0);
  }

  /**
   * Save project configuration to file
   */
  static async saveToFile(project: Project, filePath: string, pretty: boolean = true): Promise<void> {
    const json = this.generateJson(project, pretty);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, json, 'utf-8');
  }

  private async validateOptions(): Promise<void> {
    if (!this.options.outputDir) {
      throw new ProjectGenerateError('Output directory is required');
    }

    if (await fs.pathExists(this.options.outputDir) && !this.options.overwrite) {
      const files = await fs.readdir(this.options.outputDir);
      if (files.length > 0) {
        throw new ProjectGenerateError(
          `Output directory ${this.options.outputDir} is not empty. Use --overwrite to force.`
        );
      }
    }
  }

  private async createDirectories(): Promise<void> {
    const { directories } = this.project.structure;
    
    for (const dir of directories) {
      const fullPath = path.join(this.options.outputDir, dir);
      
      if (this.options.dryRun) {
        console.log(`[DRY RUN] Would create directory: ${fullPath}`);
      } else {
        await fs.ensureDir(fullPath);
        console.log(`Created directory: ${fullPath}`);
      }
    }
  }

  private async generateFiles(): Promise<void> {
    const { files } = this.project.structure;
    
    for (const file of files) {
      const fullPath = path.join(this.options.outputDir, file);
      
      if (this.options.dryRun) {
        console.log(`[DRY RUN] Would create file: ${fullPath}`);
      } else {
        await fs.ensureDir(path.dirname(fullPath));
        
        // Generate file content based on file type
        const content = await this.generateFileContent(file);
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(`Created file: ${fullPath}`);
      }
    }
  }

  private async generateConfigurationFiles(): Promise<void> {
    const { configurations } = this.project;
    
    for (const [fileName, lines] of Object.entries(configurations)) {
      const fullPath = path.join(this.options.outputDir, fileName);
      const content = lines.join('\n');
      
      if (this.options.dryRun) {
        console.log(`[DRY RUN] Would create configuration file: ${fullPath}`);
      } else {
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(`Created configuration file: ${fullPath}`);
      }
    }
  }

  private async generateFileContent(fileName: string): Promise<string> {
    const { projectConfig, dependencies } = this.project;
    
    // Basic template context
    const context = {
      projectName: projectConfig.name,
      description: projectConfig.description,
      language: projectConfig.language,
      framework: projectConfig.framework,
      dependencies,
      packageName: this.getPackageName(projectConfig.name),
      className: this.getClassName(projectConfig.name),
    };

    // Generate content based on file type
    if (fileName.endsWith('.java')) {
      return this.generateJavaFile(fileName, context);
    } else if (fileName === 'pom.xml') {
      return this.generatePomXml(context);
    } else if (fileName === 'build.gradle') {
      return this.generateBuildGradle(context);
    } else if (fileName.endsWith('.md')) {
      return this.generateMarkdownFile(fileName, context);
    }
    
    return `// Generated file: ${fileName}\n// TODO: Implement content for ${fileName}`;
  }

  private generateJavaFile(fileName: string, context: any): string {
    if (fileName.includes('Application.java')) {
      return this.generateSpringBootApplication(context);
    }
    
    return `package ${context.packageName};\n\n// TODO: Implement ${fileName}`;
  }

  private generateSpringBootApplication(context: any): string {
    const template = `package {{packageName}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * {{description}}
 */
@SpringBootApplication
public class {{className}}Application {
    public static void main(String[] args) {
        SpringApplication.run({{className}}Application.class, args);
    }
}`;

    return Handlebars.compile(template)(context);
  }

  private generatePomXml(context: any): string {
    const template = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>{{projectName}}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>{{projectName}}</name>
    <description>{{description}}</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.0.0</version>
        <relativePath/>
    </parent>

    <properties>
        <java.version>11</java.version>
    </properties>

    <dependencies>
        {{#each dependencies}}
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>{{@key}}</artifactId>
            <version>{{this}}</version>
        </dependency>
        {{/each}}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

    return Handlebars.compile(template)(context);
  }

  private generateBuildGradle(context: any): string {
    const template = `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.0'
    id 'io.spring.dependency-management' version '1.1.0'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '11'

repositories {
    mavenCentral()
}

dependencies {
    {{#each dependencies}}
    implementation '{{@key}}:{{this}}'
    {{/each}}
}

tasks.named('test') {
    useJUnitPlatform()
}`;

    return Handlebars.compile(template)(context);
  }

  private generateMarkdownFile(fileName: string, context: any): string {
    if (fileName.toLowerCase() === 'readme.md') {
      const template = `# {{projectName}}

{{description}}

## Features

- Microservice architecture
- Spring Boot 3.0
- RESTful API
- Database integration
- Docker support

## Getting Started

### Prerequisites

- Java 11 or higher
- Maven 3.6 or higher
- Docker (optional)

### Running the application

\`\`\`bash
mvn spring-boot:run
\`\`\`

### Building for production

\`\`\`bash
mvn clean package
\`\`\`

### Docker

\`\`\`bash
docker build -t {{projectName}} .
docker run -p 8080:8080 {{projectName}}
\`\`\`

## API Documentation

The API documentation is available at: http://localhost:8080/swagger-ui.html

## License

This project is licensed under the MIT License.`;

      return Handlebars.compile(template)(context);
    }
    
    return `# ${fileName}\n\nTODO: Add content for ${fileName}`;
  }

  private getPackageName(projectName: string): string {
    return `com.example.${projectName.toLowerCase().replace(/-/g, '')}`;
  }

  private getClassName(projectName: string): string {
    return projectName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
} 