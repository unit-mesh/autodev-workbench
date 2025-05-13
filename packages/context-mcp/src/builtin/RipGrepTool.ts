/*
 * MIT License
 *
 * Copyright (c) 2023 Matteo Collina https://github.com/mcollina/mcp-ripgrep
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 */

import { Tool } from "../base/Tool";
import { spawn } from "child_process";

interface RipGrepInput {
	command: "search" | "advanced-search" | "count-matches" | "list-files" | "list-file-types";
	pattern?: string;
	path?: string;
	caseSensitive?: boolean;
	fixedStrings?: boolean;
	filePattern?: string;
	fileType?: string;
	maxResults?: number;
	context?: number;
	invertMatch?: boolean;
	wordMatch?: boolean;
	includeHidden?: boolean;
	followSymlinks?: boolean;
	showFilenamesOnly?: boolean;
	showLineNumbers?: boolean;
	countLines?: boolean;
	useColors?: boolean;
}

/**
 * Interface for RipGrep tool output
 */
interface RipGrepOutput {
	result: string;
	isError?: boolean;
}

export class RipGrepTool implements Tool {
	description(): string {
		return "Search files using ripgrep (rg) with various options";
	}

	async execute(input: RipGrepInput): Promise<RipGrepOutput> {
		try {
			const command = input.command || "search";

			switch (command) {
				case "search":
					return await this.handleSearch(input);
				case "advanced-search":
					return await this.handleAdvancedSearch(input);
				case "count-matches":
					return await this.handleCountMatches(input);
				case "list-files":
					return await this.handleListFiles(input);
				case "list-file-types":
					return await this.handleListFileTypes();
				default:
					return {
						result: `Unknown command: ${command}`,
						isError: true
					};
			}
		} catch (error: any) {
			// If the command exits with code 1, it means no matches were found for ripgrep
			if (error.code === 1 && !error.stderr) {
				return {
					result: "No matches found."
				};
			}

			// Otherwise, it's a real error
			return {
				result: this.stripAnsiEscapeCodes(`Error: ${error.message}\n${error.stderr || ""}`),
				isError: true
			};
		}
	}

	icon(): string {
		return "search";
	}

	name(): string {
		return "ripgrep";
	}

	/**
	 * Strip ANSI escape sequences from a string to make it human-readable.
	 */
	private stripAnsiEscapeCodes(input: string): string {
		// eslint-disable-next-line no-control-regex
		return input.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
	}

	/**
	 * Process the output based on whether colors are requested.
	 * If colors are used, return the original output, otherwise strip ANSI codes.
	 */
	private processOutput(output: string, useColors: boolean): string {
		if (!output) return output;
		return useColors ? output : this.stripAnsiEscapeCodes(output);
	}

	/**
	 * Safely escape a string for shell command execution.
	 */
	private escapeShellArg(arg: string): string {
		// Replace all single quotes with the sequence: '"'"'
		// This ensures the argument is properly quoted in shell commands
		return `'${arg.replace(/'/g, "'\"'\"'")}'`;
	}

	/**
	 * Execute a command with isolated streams to prevent external processes
	 * from interfering with the output.
	 */
	private exec(command: string): Promise<{ stdout: string; stderr: string }> {
		return new Promise((resolve, reject) => {
			const parts = command.split(" ");
			const program = parts[0];
			const args = parts.slice(1).filter(arg => arg.length > 0);

			// Use spawn with explicit stdio control
			const child = spawn(program, args, {
				shell: true, // Use shell to handle quotes and escaping
			});

			let stdout = "";
			let stderr = "";

			child.stdout.setEncoding("utf8");
			child.stderr.setEncoding("utf8");

			child.stdout.on("data", (data) => {
				stdout += data;
			});

			child.stderr.on("data", (data) => {
				stderr += data;
			});

			child.on("close", (code) => {
				if (code === 0 || code === 1) { // Code 1 is "no matches" for ripgrep
					resolve({ stdout, stderr });
				} else {
					const error = new Error(`Command failed with exit code ${code}`);
					Object.assign(error, { code, stdout, stderr });
					reject(error);
				}
			});

			// Handle process errors
			child.on("error", (error) => {
				reject(error);
			});
		});
	}

	private async handleSearch(input: RipGrepInput): Promise<RipGrepOutput> {
		const pattern = String(input.pattern || "");
		const path = String(input.path || ".");
		const caseSensitive = input.caseSensitive;
		const filePattern = input.filePattern;
		const maxResults = input.maxResults;
		const context = input.context;
		const useColors = input.useColors === true;

		if (!pattern) {
			return {
				result: "Error: Pattern is required",
				isError: true
			};
		}

		// Build the rg command with flags
		let command = "rg";

		// Add case sensitivity flag if specified
		if (caseSensitive === true) {
			command += " -s"; // Case sensitive
		} else if (caseSensitive === false) {
			command += " -i"; // Case insensitive
		}

		// Add file pattern if specified
		if (filePattern) {
			command += ` -g ${this.escapeShellArg(filePattern)}`;
		}

		// Add max results if specified
		if (maxResults !== undefined && maxResults > 0) {
			command += ` -m ${maxResults}`;
		}

		// Add context lines if specified
		if (context !== undefined && context > 0) {
			command += ` -C ${context}`;
		}

		// Add line numbers
		command += " -n";

		// Add color setting
		command += useColors ? " --color always" : " --color never";

		// Add pattern and path
		command += ` ${this.escapeShellArg(pattern)} ${this.escapeShellArg(path)}`;

		const { stdout, stderr } = await this.exec(command);

		// If there's anything in stderr, log it for debugging
		if (stderr) {
			console.error(`ripgrep stderr: ${stderr}`);
		}

		return {
			result: this.processOutput(stdout, useColors) || "No matches found"
		};
	}

	private async handleAdvancedSearch(input: RipGrepInput): Promise<RipGrepOutput> {
		const pattern = String(input.pattern || "");
		const path = String(input.path || ".");
		const caseSensitive = input.caseSensitive;
		const fixedStrings = input.fixedStrings;
		const filePattern = input.filePattern;
		const fileType = input.fileType;
		const maxResults = input.maxResults;
		const context = input.context;
		const invertMatch = input.invertMatch;
		const wordMatch = input.wordMatch;
		const includeHidden = input.includeHidden;
		const followSymlinks = input.followSymlinks;
		const showFilenamesOnly = input.showFilenamesOnly;
		const showLineNumbers = input.showLineNumbers;
		const useColors = input.useColors === true;

		if (!pattern) {
			return {
				result: "Error: Pattern is required",
				isError: true
			};
		}

		// Build the rg command with flags
		let command = "rg";

		// Add case sensitivity flag if specified
		if (caseSensitive === true) {
			command += " -s"; // Case sensitive
		} else if (caseSensitive === false) {
			command += " -i"; // Case insensitive
		}

		// Add fixed strings flag if specified
		if (fixedStrings === true) {
			command += " -F"; // Fixed strings
		}

		// Add file pattern if specified
		if (filePattern) {
			command += ` -g ${this.escapeShellArg(filePattern)}`;
		}

		// Add file type if specified
		if (fileType) {
			command += ` -t ${fileType}`;
		}

		// Add max results if specified
		if (maxResults !== undefined && maxResults > 0) {
			command += ` -m ${maxResults}`;
		}

		// Add context lines if specified
		if (context !== undefined && context > 0) {
			command += ` -C ${context}`;
		}

		// Add invert match if specified
		if (invertMatch === true) {
			command += " -v";
		}

		// Add word match if specified
		if (wordMatch === true) {
			command += " -w";
		}

		// Add hidden files flag if specified
		if (includeHidden === true) {
			command += " -."
		}

		// Add follow symlinks flag if specified
		if (followSymlinks === true) {
			command += " -L";
		}

		// Add filenames only flag if specified
		if (showFilenamesOnly === true) {
			command += " -l";
		}

		// Add line numbers flag if specified
		if (showLineNumbers === true) {
			command += " -n";
		} else if (showLineNumbers === false) {
			command += " -N";
		} else {
			// Default to showing line numbers
			command += " -n";
		}

		// Add color setting
		command += useColors ? " --color always" : " --color never";

		// Add pattern and path
		command += ` ${this.escapeShellArg(pattern)} ${this.escapeShellArg(path)}`;

		const { stdout, stderr } = await this.exec(command);

		// If there's anything in stderr, log it for debugging
		if (stderr) {
			console.error(`ripgrep stderr: ${stderr}`);
		}

		return {
			result: this.processOutput(stdout, useColors) || "No matches found"
		};
	}

	private async handleCountMatches(input: RipGrepInput): Promise<RipGrepOutput> {
		const pattern = String(input.pattern || "");
		const path = String(input.path || ".");
		const caseSensitive = input.caseSensitive;
		const filePattern = input.filePattern;
		const countLines = input.countLines !== false; // Default to true
		const useColors = input.useColors === true;

		if (!pattern) {
			return {
				result: "Error: Pattern is required",
				isError: true
			};
		}

		// Build the rg command with flags
		let command = "rg";

		// Add case sensitivity flag if specified
		if (caseSensitive === true) {
			command += " -s"; // Case sensitive
		} else if (caseSensitive === false) {
			command += " -i"; // Case insensitive
		}

		// Add file pattern if specified
		if (filePattern) {
			command += ` -g ${this.escapeShellArg(filePattern)}`;
		}

		// Add count flag
		if (countLines) {
			command += " -c"; // Count lines
		} else {
			command += " --count-matches"; // Count total matches
		}

		// Add color setting
		command += useColors ? " --color always" : " --color never";

		// Add pattern and path
		command += ` ${this.escapeShellArg(pattern)} ${this.escapeShellArg(path)}`;

		const { stdout, stderr } = await this.exec(command);

		// If there's anything in stderr, log it for debugging
		if (stderr) {
			console.error(`ripgrep stderr: ${stderr}`);
		}

		return {
			result: this.processOutput(stdout, useColors) || "No matches found"
		};
	}

	private async handleListFiles(input: RipGrepInput): Promise<RipGrepOutput> {
		const path = String(input.path || ".");
		const filePattern = input.filePattern;
		const fileType = input.fileType;
		const includeHidden = input.includeHidden;

		// Build the rg command with flags
		let command = "rg --files";

		// Add file pattern if specified
		if (filePattern) {
			command += ` -g ${this.escapeShellArg(filePattern)}`;
		}

		// Add file type if specified
		if (fileType) {
			command += ` -t ${fileType}`;
		}

		// Add hidden files flag if specified
		if (includeHidden === true) {
			command += " -."
		}

		// No colors for file listing
		command += " --color never";

		// Add path
		command += ` ${this.escapeShellArg(path)}`;

		const { stdout, stderr } = await this.exec(command);

		// If there's anything in stderr, log it for debugging
		if (stderr) {
			console.error(`ripgrep stderr: ${stderr}`);
		}

		return {
			result: this.stripAnsiEscapeCodes(stdout) || "No files found"
		};
	}

	private async handleListFileTypes(): Promise<RipGrepOutput> {
		// No colors for type listing
		const command = "rg --type-list --color never";

		const { stdout, stderr } = await this.exec(command);

		// If there's anything in stderr, log it for debugging
		if (stderr) {
			console.error(`ripgrep stderr: ${stderr}`);
		}

		return {
			result: this.stripAnsiEscapeCodes(stdout) || "Failed to get file types"
		};
	}
}
