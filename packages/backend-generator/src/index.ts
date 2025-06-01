import { readFileSync } from 'fs';
import { join, dirname } from 'path';

export * from './types/project-config.js';

export { ProjectParser, ProjectParseError } from './parser/project-parser.js';

export { ProjectGenerator, ProjectGenerateError, type GeneratorOptions } from './generator/project-generator.js';

const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const version = packageJson.version;
