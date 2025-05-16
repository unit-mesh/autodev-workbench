# @autodev/worker-core

> Core models and utilities for autodev workbench

## Overview

This package provides core functionality for the autodev workbench, including:

- Code data structure models
- Filesystem utilities
- Command execution tools

## Features

### Code Models

The package includes various interfaces and types for representing code structures:

- `CodeDataStruct` - Representation of code structures like classes, interfaces, etc.
- `CodeFunction` - Representation of functions/methods
- `CodeField` - Representation of class/struct fields
- `CodeParameter` - Function parameter representations
- `CodePosition` - Position information for code elements
- `ApiResource` - Resource representation for APIs

### Filesystem Utilities

- File listing and searching
- Path manipulation utilities
- File system constants and configurations

### Command Execution

- Integration with tools like ripgrep for efficient code searching
- Binary execution utilities

## Installation

```bash
npm install @autodev/worker-core
# or
yarn add @autodev/worker-core
# or
pnpm add @autodev/worker-core
```

## Usage

```typescript
import { CodeDataStruct, DataStructType } from '@autodev/worker-core';
// Use the imported types and utilities as needed
```

## License

Apache-2.0
