# @autodev/worker-protobuf

> Analysis Protobuf worker for @autodev/worker

## Overview

This package provides a worker for analyzing Protocol Buffer (.proto) files and converting them into structured data representations that can be used by the AutoDev system. It's designed to extract information about messages, services, enums, and other Protobuf structures.

## Features

- Scan directories for .proto files
- Parse and analyze Protobuf files
- Extract message types, enum types, and service definitions
- Generate API resources from Protobuf definitions
- Convert Protobuf structures to standard CodeDataStruct format

## Installation

```bash
npm install @autodev/worker-protobuf
# or
pnpm add @autodev/worker-protobuf
```

## Usage

```typescript
import { scanProtoFiles, analyseProtos } from '@autodev/worker-protobuf';

// Scan a directory for .proto files
const protoFiles = await scanProtoFiles('./path/to/protos');

// Analyze all found proto files
const results = await analyseProtos(protoFiles);

// Process the results
console.log(`Found ${results.length} proto files with structures`);
```

## API

### `scanProtoFiles(dirPath: string): Promise<string[]>`

Scans a directory recursively for all .proto files.

### `analyseProtos(protoFiles: string[]): Promise<AnalysisResult[]>`

Analyzes an array of .proto file paths and returns structured information about each file.

### `ProtoAnalyser`

A class that provides methods to analyze Protobuf file content and convert it to CodeDataStruct objects.

### `ProtoApiResourceGenerator`

Generates API resources from Protobuf definitions.

## License

MIT
