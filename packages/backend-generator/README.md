# Backend Generator

A TypeScript-based backend project generator with support for parsing and generating project configurations. Built with TypeScript, Vite, and Commander.

## Features

- 🔍 **Parse and validate** project configuration JSON files
- 🏗️ **Generate project structures** from configuration files
- 📝 **Template-based file generation** with Handlebars
- 🧪 **Comprehensive testing** with Vitest
- 🎨 **Beautiful CLI** with colored output
- 🔧 **TypeScript support** with full type safety
- ⚡ **Fast builds** with Vite

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test
```

## Usage

### CLI Commands

Use `npx @autodev/backend-generator` to run the CLI commands without installing globally.

```bash
➜  backend-generator git:(master) npx @autodev/backend-generator@latest generate examples/customer-order-management.json
🔍 Parsing project configuration...
✅ Configuration parsed successfully!
🏗️  Generating project structure to: ./generated-project
Created directory: generated-project/src/main/java
Created directory: generated-project/src/main/resources
Created directory: generated-project/src/test/java
Created directory: generated-project/src/test/resources
Created directory: generated-project/src/main/docker
Created file: generated-project/pom.xml
Created file: generated-project/build.gradle
Created file: generated-project/application.properties
Created file: generated-project/Dockerfile
Created file: generated-project/src/main/java/com/example/customerordermanagement/CustomerOrderManagementApplication.java
Created file: generated-project/src/main/java/com/example/customerordermanagement/config
Created configuration file: generated-project/application.properties
Created configuration file: generated-project/Dockerfile
🎉 Project generated successfully!
📁 Project location: /Users/phodal/ai/autodev-work/packages/backend-generator/generated-project
```

#### Parse and validate a configuration file

```bash
# Basic validation
backend-generator parse examples/customer-order-management.json

# Verbose output with details
backend-generator parse examples/customer-order-management.json --verbose
```

#### Generate project structure

```bash
# Generate to default directory (./generated-project)
backend-generator generate examples/customer-order-management.json

# Generate to custom directory
backend-generator generate examples/customer-order-management.json --output ./my-project

# Dry run (show what would be generated)
backend-generator generate examples/customer-order-management.json --dry-run

# Overwrite existing files
backend-generator generate examples/customer-order-management.json --overwrite
```

#### Create a sample configuration

```bash
# Create sample configuration
backend-generator create

# Create with custom output path
backend-generator create --output ./my-config.json
```

#### Validate configuration

```bash
backend-generator validate examples/customer-order-management.json
```

#### Export configuration

```bash
# Export as formatted JSON
backend-generator export examples/customer-order-management.json --format json --output formatted.json
```

### Programmatic API

```typescript
import { 
  ProjectParser, 
  ProjectGenerator, 
  Project 
} from '@autodev/backend-generator';

// Parse configuration from JSON
const project = ProjectParser.parseFromJson(jsonString);

// Validate configuration
const result = ProjectParser.validate(data);
if (result.success) {
  console.log('Valid configuration:', result.data);
} else {
  console.error('Validation error:', result.error);
}

// Generate project structure
const generator = new ProjectGenerator(project, {
  outputDir: './output',
  overwrite: true,
});

await generator.generate();

// Generate JSON configuration
const json = ProjectGenerator.generateJson(project, true);
await ProjectGenerator.saveToFile(project, './config.json');
```

## Configuration Schema

The project configuration follows this schema:

```typescript
interface Project {
  projectConfig: {
    name: string;
    description: string;
    type: 'microservice' | 'monolith' | 'library';
    language: 'java' | 'typescript' | 'python' | 'go' | 'csharp';
    framework: string;
  };
  features: string[];
  structure: {
    directories: string[];
    files: string[];
  };
  dependencies: Record<string, string>;
  configurations: Record<string, string[]>;
}
```

### Example Configuration

```json
{
  "projectConfig": {
    "name": "customer-order-management",
    "description": "A microservice system for managing customer orders",
    "type": "microservice",
    "language": "java",
    "framework": "spring3"
  },
  "features": [
    "authentication-authorization",
    "database-integration",
    "api-documentation"
  ],
  "structure": {
    "directories": [
      "src/main/java",
      "src/main/resources",
      "src/test/java"
    ],
    "files": [
      "pom.xml",
      "README.md",
      "Dockerfile"
    ]
  },
  "dependencies": {
    "spring-boot-starter": "3.0.0",
    "spring-boot-starter-web": "3.0.0"
  },
  "configurations": {
    "application.properties": [
      "server.port=8080",
      "spring.application.name=customer-order-management"
    ]
  }
}
```

## Supported Project Types

- **microservice**: Microservice architecture
- **monolith**: Monolithic application
- **library**: Reusable library/package

## Supported Languages

- **java**: Java with Spring Boot support
- **typescript**: TypeScript/Node.js projects
- **python**: Python projects
- **go**: Go projects
- **csharp**: C#/.NET projects

## Common Features

- `authentication-authorization`: User authentication and authorization
- `database-integration`: Database connectivity and ORM
- `api-documentation`: API documentation (Swagger/OpenAPI)
- `data-validation`: Input validation
- `docker-support`: Docker containerization
- `ci-cd-pipeline`: CI/CD pipeline configuration
- `testing-framework`: Unit and integration testing
- `logging-system`: Structured logging
- `monitoring-metrics`: Application monitoring and metrics
- `caching`: Caching layer
- `message-queue`: Message queue integration
- `file-upload`: File upload handling
- `email-service`: Email service integration
- `notification-service`: Push notifications

## Development

### Project Structure

```
packages/backend-generator/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── parser/          # Configuration parsing logic
│   ├── generator/       # Project generation logic
│   ├── test/           # Unit tests
│   ├── cli.ts          # CLI interface
│   └── index.ts        # Main entry point
├── examples/           # Example configurations
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Scripts

- `pnpm run build`: Build the project
- `pnpm run dev`: Build in watch mode
- `pnpm run test`: Run tests
- `pnpm run test:watch`: Run tests in watch mode
- `pnpm run test:coverage`: Run tests with coverage

### Testing

The project includes comprehensive unit tests using Vitest:

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details. 
