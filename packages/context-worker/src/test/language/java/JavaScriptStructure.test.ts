import { describe, it, expect, beforeEach } from 'vitest';

import { TestLanguageServiceProvider } from "../../TestLanguageService";
import { JavaScriptStructurer } from "../../../code-context/javascript/JavaScriptStructurer";
import { CodeFile, StructureType } from "../../../codemodel/CodeElement";

const Parser = require('web-tree-sitter');

describe('JavaScriptStructure', () => {
	it('should convert a simple class file to CodeFile', async () => {
		const jsClassExample = `import { injectable } from 'inversify';
import { BaseAnalyzer } from './BaseAnalyzer';

@injectable()
export class ExampleClass extends BaseAnalyzer {
	constructor() {
		super();
		this.counter = 0;
	}
	
	analyze(data) {
		console.log("Analyzing data");
	}
	
	getResults() {
		return { count: this.counter };
	}
}`;

		await Parser.init();
		const parser = new Parser();
		const languageService = new TestLanguageServiceProvider(parser);

		const structurer = new JavaScriptStructurer();
		await structurer.init(languageService);

		const codeFile = await structurer.parseFile(jsClassExample, 'example.js');

		expect(codeFile as CodeFile).toEqual({
			name: 'example.js',
			filepath: 'example.js',
			language: 'javascript',
			functions: [],
			path: '',
			package: '',
			imports: ["'inversify'", "'./BaseAnalyzer'"],
			classes: [
				{
					type: StructureType.Class,
					canonicalName: '',
					constant: [],
					extends: ['BaseAnalyzer'],
					methods: [
						{
							"end": {
								"column": 2,
								"row": 8,
							},
							"name": "constructor",
							"start": {
								"column": 1,
								"row": 5,
							},
							"vars": [],
						},
						{
							vars: [],
							name: 'analyze',
							start: {
								row: 10,
								column: 1,
							},
							end: {
								row: 12,
								column: 2,
							},
						},
						{
							vars: [],
							name: 'getResults',
							start: {
								row: 14,
								column: 1,
							},
							end: {
								row: 16,
								column: 2,
							},
						},
					],
					name: 'ExampleClass',
					package: '',
					implements: [],
					start: {
						row: 4,
						column: 7,
					},
					end: {
						row: 17,
						column: 1,
					},
				},
			],
		});
	});

	it('should parse standalone functions', async () => {
		const jsFunctionExample = `import { resolve } from 'path';

export function parseConfig(configPath) {
    console.log("Parsing config");
    return { success: true };
}

function helperFunction(data) {
    return data.trim();
}`;

		await Parser.init();
		const parser = new Parser();
		const languageService = new TestLanguageServiceProvider(parser);

		const structurer = new JavaScriptStructurer();
		await structurer.init(languageService);

		const codeFile = await structurer.parseFile(jsFunctionExample, 'functions.js');
		expect(codeFile as CodeFile).toEqual({
			name: 'functions.js',
			filepath: 'functions.js',
			language: 'javascript',
			path: '',
			package: '',
			imports: ["'path'"],
			classes: [],
			functions: [
				{
					vars: [],
					name: 'parseConfig',
					start: {
						row: 2,
						column: 0,
					},
					end: {
						row: 5,
						column: 1,
					},
				},
				{
					vars: [],
					name: 'helperFunction',
					start: {
						row: 0,
						column: 0,
					},
					end: {
						row: 9,
						column: 1,
					},
				},
			],
		});
	});

	it('should parse ES6 class with static methods and arrow functions', async () => {
		const jsES6ClassExample = `import React from 'react';

export class Utility {
    static formatData(input) {
        return input.toUpperCase();
    }
    
    processItem = (item) => {
        return item * 2;
    }
    
    render() {
        const items = [1, 2, 3].map(this.processItem);
        return items;
    }
}

export const helper = (data) => {
    return Utility.formatData(data);
};`;

		await Parser.init();
		const parser = new Parser();
		const languageService = new TestLanguageServiceProvider(parser);

		const structurer = new JavaScriptStructurer();
		await structurer.init(languageService);

		const codeFile = await structurer.parseFile(jsES6ClassExample, 'utility.js');
		expect(codeFile as CodeFile).toEqual({
			name: 'utility.js',
			filepath: 'utility.js',
			language: 'javascript',
			path: '',
			package: '',
			imports: ["'react'"],
			classes: [
				{
					type: StructureType.Class,
					canonicalName: '',
					constant: [],
					extends: [],
					methods: [
						{
							"end": {
								"column": 5,
								"row": 5,
							},
							"name": "formatData",
							"start": {
								"column": 4,
								"row": 3,
							},
							"vars": [],
						},
						{
							vars: [],
							name: 'render',
							start: {
								row: 11,
								column: 4,
							},
							end: {
								row: 14,
								column: 5,
							},
						},
					],
					name: 'Utility',
					package: '',
					implements: [],
					start: {
						row: 2,
						column: 7,
					},
					end: {
						row: 15,
						column: 1,
					},
				},
			],
			functions: [],
		});
	});
});
