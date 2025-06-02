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
