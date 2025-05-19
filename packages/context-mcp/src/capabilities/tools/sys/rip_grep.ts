/*
 * MIT License
 *
 * Copyright (c) 2023 Matteo Collina https://github.com/mcollina/mcp-ripgrep
 * Copyright (c) 2025 autodev https://github.com/unit-mesh/autodev-workbench
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

import { ToolLike } from "../_typing";
import { z } from "zod";
import { spawn } from "child_process";

export const installRipGrepTool: ToolLike = (installer) => {
	installer("ripgrep", "Search files using ripgrep (rg) with various options", {
		command: z.enum(["search", "advanced-search", "count-matches", "list-files", "list-file-types"]).default("search"),
		pattern: z.string().optional().describe("Pattern to search for"),
		path: z.string().default(".").describe("Path to search in"),
		caseSensitive: z.boolean().optional().describe("Whether to perform case-sensitive search"),
		fixedStrings: z.boolean().optional().describe("Treat pattern as literal string"),
		filePattern: z.string().optional().describe("Glob pattern for files to search"),
		fileType: z.string().optional().describe("File type to search"),
		maxResults: z.number().optional().describe("Maximum number of results to return"),
		context: z.number().optional().describe("Number of context lines to show"),
		invertMatch: z.boolean().optional().describe("Invert the match"),
		wordMatch: z.boolean().optional().describe("Match whole words only"),
		includeHidden: z.boolean().optional().describe("Include hidden files"),
		followSymlinks: z.boolean().optional().describe("Follow symlinks"),
		showFilenamesOnly: z.boolean().optional().describe("Show only filenames"),
		showLineNumbers: z.boolean().optional().describe("Show line numbers"),
		countLines: z.boolean().optional().describe("Count lines instead of matches"),
		useColors: z.boolean().optional().describe("Use colors in output")
	}, async (args) => {
		try {
			const { stdout, stderr } = await execRipGrep(args);
			
			if (stderr) {
				console.error(`ripgrep stderr: ${stderr}`);
			}

			return {
				content: [
					{
						type: "text",
						text: processOutput(stdout, args.useColors) || "No matches found"
					}
				]
			};
		} catch (error: any) {
			// If the command exits with code 1, it means no matches were found for ripgrep
			if (error.code === 1 && !error.stderr) {
				return {
					content: [
						{
							type: "text",
							text: "No matches found."
						}
					]
				};
			}

			return {
				content: [
					{
						type: "text",
						text: `Error: ${error.message}\n${error.stderr || ""}`
					}
				]
			};
		}
	});
};

/**
 * Execute ripgrep with the given arguments
 */
async function execRipGrep(args: any): Promise<{ stdout: string; stderr: string }> {
	const command = buildRipGrepCommand(args);
	return new Promise((resolve, reject) => {
		const parts = command.split(" ");
		const program = parts[0];
		const cmdArgs = parts.slice(1).filter(arg => arg.length > 0);

		const child = spawn(program, cmdArgs, {
			shell: true,
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
			if (code === 0 || code === 1) {
				resolve({ stdout, stderr });
			} else {
				const error = new Error(`Command failed with exit code ${code}`);
				Object.assign(error, { code, stdout, stderr });
				reject(error);
			}
		});

		child.on("error", (error) => {
			reject(error);
		});
	});
}

/**
 * Build the ripgrep command based on the input arguments
 */
function buildRipGrepCommand(args: any): string {
	let command = "rg";

	switch (args.command) {
		case "list-files":
			command += " --files";
			if (args.filePattern) command += ` -g ${escapeShellArg(args.filePattern)}`;
			if (args.fileType) command += ` -t ${args.fileType}`;
			if (args.includeHidden) command += " -.";
			command += " --color never";
			break;

		case "list-file-types":
			return "rg --type-list --color never";

		case "count-matches":
			command += args.countLines ? " -c" : " --count-matches";
			if (args.caseSensitive === true) command += " -s";
			else if (args.caseSensitive === false) command += " -i";
			if (args.filePattern) command += ` -g ${escapeShellArg(args.filePattern)}`;
			command += args.useColors ? " --color always" : " --color never";
			break;

		case "advanced-search":
		case "search":
			if (args.caseSensitive === true) command += " -s";
			else if (args.caseSensitive === false) command += " -i";
			if (args.fixedStrings) command += " -F";
			if (args.filePattern) command += ` -g ${escapeShellArg(args.filePattern)}`;
			if (args.fileType) command += ` -t ${args.fileType}`;
			if (args.maxResults) command += ` -m ${args.maxResults}`;
			if (args.context) command += ` -C ${args.context}`;
			if (args.invertMatch) command += " -v";
			if (args.wordMatch) command += " -w";
			if (args.includeHidden) command += " -.";
			if (args.followSymlinks) command += " -L";
			if (args.showFilenamesOnly) command += " -l";
			if (args.showLineNumbers === true) command += " -n";
			else if (args.showLineNumbers === false) command += " -N";
			else command += " -n";
			command += args.useColors ? " --color always" : " --color never";
			break;
	}

	if (args.pattern && args.command !== "list-files" && args.command !== "list-file-types") {
		command += ` ${escapeShellArg(args.pattern)}`;
	}
	
	command += ` ${escapeShellArg(args.path)}`;
	return command;
}

/**
 * Process the output based on whether colors are requested
 */
function processOutput(output: string, useColors?: boolean): string {
	if (!output) return output;
	return useColors ? output : stripAnsiEscapeCodes(output);
}

/**
 * Strip ANSI escape sequences from a string
 */
function stripAnsiEscapeCodes(input: string): string {
	return input.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Safely escape a string for shell command execution
 */
function escapeShellArg(arg: string): string {
	return `'${arg.replace(/'/g, "'\"'\"'")}'`;
}
