#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ProjectParser, ProjectParseError } from './parser/project-parser.js';
import { ProjectGenerator, ProjectGenerateError } from './generator/project-generator.js';
import { Project } from './types/project-config.js';
import * as fs from 'fs-extra';
import * as path from 'path';

const program = new Command();

program
  .name('backend-generator')
  .description('Backend project generator with support for parsing and generating project configurations')
  .version('0.1.0');

// Add command - NEW
program
  .command('add')
  .description('Download and generate project from a Golden Path configuration URL')
  .argument('<url>', 'URL to the Golden Path configuration API endpoint')
  .option('-o, --output <dir>', 'Output directory for the generated project')
  .option('--overwrite', 'Overwrite existing files')
  .option('--dry-run', 'Show what would be generated without creating files')
  .option('--save-config', 'Save the downloaded configuration to a local file')
  .action(async (url: string, options: { 
    output?: string; 
    overwrite?: boolean; 
    dryRun?: boolean;
    saveConfig?: boolean;
  }) => {
    try {
      console.log(chalk.blue('🌐 Downloading Golden Path configuration...'));
      console.log(chalk.gray(`   URL: ${url}`));
      
      // Download configuration from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.status} ${response.statusText}`);
      }
      
      const configData = await response.json();
      
      // Extract the actual config from the API response
      let projectConfig: Project;
      if (configData.config) {
        // API response format: { id, name, description, config: Project }
        projectConfig = configData.config;
        console.log(chalk.green('✅ Configuration downloaded successfully!'));
        console.log(chalk.cyan(`   Name: ${configData.name || 'Unknown'}`));
        console.log(chalk.cyan(`   Description: ${configData.description || 'No description'}`));
      } else {
        // Direct project config format
        projectConfig = configData;
        console.log(chalk.green('✅ Configuration downloaded successfully!'));
      }
      
      // Validate the downloaded configuration
      const validation = ProjectParser.validate(projectConfig);
      if (!validation.success) {
        throw new ProjectParseError('Downloaded configuration is invalid', validation.error);
      }
      
      const project = validation.data!;
      
      // Save config to local file if requested
      if (options.saveConfig) {
        const configFileName = `${project.projectConfig.name}-config.json`;
        await ProjectGenerator.saveToFile(project, configFileName);
        console.log(chalk.green(`💾 Configuration saved to: ${configFileName}`));
      }
      
      // Determine output directory
      const outputDir = options.output || `./${project.projectConfig.name}`;
      
      console.log(chalk.blue(`🏗️  Generating project structure to: ${outputDir}`));
      
      // Generate the project
      const generator = new ProjectGenerator(project, {
        outputDir,
        overwrite: options.overwrite,
        dryRun: options.dryRun,
      });
      
      await generator.generate();
      
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run completed. No files were created.'));
      } else {
        console.log(chalk.green('🎉 Project generated successfully!'));
        console.log(chalk.cyan(`📁 Project location: ${path.resolve(outputDir)}`));
        console.log(chalk.cyan('💡 Next steps:'));
        console.log(chalk.gray(`   cd ${outputDir}`));
        console.log(chalk.gray('   # Follow the README.md for further instructions'));
      }
      
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(chalk.red('❌ Network error:'), 'Unable to connect to the URL. Please check your internet connection and URL.');
      } else if (error instanceof ProjectParseError || error instanceof ProjectGenerateError) {
        console.error(chalk.red('❌ Generation failed:'), error.message);
        if (error.details) {
          console.error(chalk.gray('Details:'), JSON.stringify(error.details, null, 2));
        }
      } else {
        console.error(chalk.red('❌ Unexpected error:'), error);
      }
      process.exit(1);
    }
  });

// Parse command
program
  .command('parse')
  .description('Parse and validate a project configuration file')
  .argument('<file>', 'Path to the project configuration JSON file')
  .option('-v, --verbose', 'Show detailed validation information')
  .action(async (file: string, options: { verbose?: boolean }) => {
    try {
      console.log(chalk.blue('🔍 Parsing project configuration...'));
      
      const project = await ProjectParser.parseFromFile(file);
      
      console.log(chalk.green('✅ Project configuration is valid!'));
      
      if (options.verbose) {
        console.log('\n' + chalk.cyan('Project Details:'));
        console.log(`  Name: ${project.projectConfig.name}`);
        console.log(`  Type: ${project.projectConfig.type}`);
        console.log(`  Language: ${project.projectConfig.language}`);
        console.log(`  Framework: ${project.projectConfig.framework}`);
        console.log(`  Features: ${project.features.length} features`);
        console.log(`  Directories: ${project.structure.directories.length} directories`);
        console.log(`  Files: ${project.structure.files.length} files`);
        console.log(`  Dependencies: ${Object.keys(project.dependencies).length} dependencies`);
      }
    } catch (error) {
      if (error instanceof ProjectParseError) {
        console.error(chalk.red('❌ Parsing failed:'), error.message);
        if (error.details && options.verbose) {
          console.error(chalk.gray('Details:'), JSON.stringify(error.details, null, 2));
        }
      } else {
        console.error(chalk.red('❌ Unexpected error:'), error);
      }
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate')
  .description('Generate project structure from configuration file')
  .argument('<file>', 'Path to the project configuration JSON file')
  .option('-o, --output <dir>', 'Output directory', './generated-project')
  .option('--overwrite', 'Overwrite existing files')
  .option('--dry-run', 'Show what would be generated without creating files')
  .action(async (file: string, options: { 
    output: string; 
    overwrite?: boolean; 
    dryRun?: boolean;
  }) => {
    try {
      console.log(chalk.blue('🔍 Parsing project configuration...'));
      const project = await ProjectParser.parseFromFile(file);
      
      console.log(chalk.green('✅ Configuration parsed successfully!'));
      console.log(chalk.blue(`🏗️  Generating project structure to: ${options.output}`));
      
      const generator = new ProjectGenerator(project, {
        outputDir: options.output,
        overwrite: options.overwrite,
        dryRun: options.dryRun,
      });
      
      await generator.generate();
      
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run completed. No files were created.'));
      } else {
        console.log(chalk.green('🎉 Project generated successfully!'));
        console.log(chalk.cyan(`📁 Project location: ${path.resolve(options.output)}`));
      }
    } catch (error) {
      if (error instanceof ProjectParseError || error instanceof ProjectGenerateError) {
        console.error(chalk.red('❌ Generation failed:'), error.message);
      } else {
        console.error(chalk.red('❌ Unexpected error:'), error);
      }
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate a project configuration without generating files')
  .argument('<file>', 'Path to the project configuration JSON file')
  .action(async (file: string) => {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const data = JSON.parse(content);
      const result = ProjectParser.validate(data);
      
      if (result.success) {
        console.log(chalk.green('✅ Configuration is valid!'));
        const project = result.data!;
        console.log(chalk.cyan('\nSummary:'));
        console.log(`  Project: ${project.projectConfig.name}`);
        console.log(`  Type: ${project.projectConfig.type}`);
        console.log(`  Language: ${project.projectConfig.language}`);
        console.log(`  Framework: ${project.projectConfig.framework}`);
      } else {
        console.error(chalk.red('❌ Configuration is invalid:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(chalk.red('❌ Invalid JSON format:'), error.message);
      } else {
        console.error(chalk.red('❌ Error reading file:'), error);
      }
      process.exit(1);
    }
  });

// Create command
program
  .command('create')
  .description('Create a new project configuration interactively')
  .option('-o, --output <file>', 'Output file path', './project-config.json')
  .action(async (options: { output: string }) => {
    try {
      console.log(chalk.blue('🚀 Creating new project configuration...'));
      
      // For now, create a sample configuration
      const sampleProject: Project = {
        projectConfig: {
          name: 'sample-project',
          description: 'A sample project configuration',
          type: 'microservice',
          language: 'java',
          framework: 'spring3',
        },
        features: [
          'authentication-authorization',
          'database-integration',
          'api-documentation',
        ],
        structure: {
          directories: [
            'src/main/java',
            'src/main/resources',
            'src/test/java',
          ],
          files: [
            'pom.xml',
            'README.md',
          ],
        },
        dependencies: {
          'spring-boot-starter': '3.0.0',
          'spring-boot-starter-web': '3.0.0',
        },
        configurations: {
          'application.properties': [
            'server.port=8080',
            'spring.application.name=sample-project',
          ],
        },
      };
      
      await ProjectGenerator.saveToFile(sampleProject, options.output);
      console.log(chalk.green(`✅ Sample configuration created: ${options.output}`));
      console.log(chalk.cyan('💡 Edit the file and use "generate" command to create your project.'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to create configuration:'), error);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export project configuration to different formats')
  .argument('<file>', 'Path to the project configuration JSON file')
  .option('-f, --format <format>', 'Output format (json, yaml)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .action(async (file: string, options: { format: string; output?: string }) => {
    try {
      const project = await ProjectParser.parseFromFile(file);
      
      if (options.format === 'json') {
        const json = ProjectGenerator.generateJson(project, true);
        const outputFile = options.output || file.replace(/\.json$/, '.formatted.json');
        await fs.writeFile(outputFile, json, 'utf-8');
        console.log(chalk.green(`✅ Exported to: ${outputFile}`));
      } else {
        console.error(chalk.red('❌ Unsupported format:'), options.format);
        console.log(chalk.cyan('Supported formats: json'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Export failed:'), error);
      process.exit(1);
    }
  });

program.parse();