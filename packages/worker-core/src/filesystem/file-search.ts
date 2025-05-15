/**
 * @license Apache-2.0
 * Copyright 2025 Roo Code, Inc. https://github.com/RooVetGit/Roo-Code
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */
import * as path from "path"
import * as fs from "fs"
import * as childProcess from "child_process"
import * as readline from "readline"
import { byLengthAsc, Fzf } from "fzf"
import { getBinPath } from "../cmd/binary/ripgrep";
import { rootDir } from "./constants";

export type FileResult = { path: string; type: "file" | "folder"; label?: string }

export async function executeRipgrep({ args, workspacePath, limit = 500}: {
	args: string[]
	workspacePath: string
	limit?: number
}): Promise<FileResult[]> {
	const rgPath = await getBinPath(rootDir())

	if (!rgPath) {
		throw new Error(`ripgrep not found: ${rgPath}`)
	}

	return new Promise((resolve, reject) => {
		const rgProcess = childProcess.spawn(rgPath, args)
		const rl = readline.createInterface({ input: rgProcess.stdout, crlfDelay: Infinity })
		const fileResults: FileResult[] = []
		const dirSet = new Set<string>() // Track unique directory paths.

		let count = 0

		rl.on("line", (line) => {
			if (count < limit) {
				try {
					const relativePath = path.relative(workspacePath, line)

					// Add the file itself.
					fileResults.push({ path: relativePath, type: "file", label: path.basename(relativePath) })

					// Extract and store all parent directory paths.
					let dirPath = path.dirname(relativePath)

					while (dirPath && dirPath !== "." && dirPath !== "/") {
						dirSet.add(dirPath)
						dirPath = path.dirname(dirPath)
					}

					count++
				} catch (error) {
					// Silently ignore errors processing individual paths.
				}
			} else {
				rl.close()
				rgProcess.kill()
			}
		})

		let errorOutput = ""

		rgProcess.stderr.on("data", (data) => {
			errorOutput += data.toString()
		})

		rl.on("close", () => {
			if (errorOutput && fileResults.length === 0) {
				reject(new Error(`ripgrep process error: ${errorOutput}`))
			} else {
				// Convert directory set to array of directory objects.
				const dirResults = Array.from(dirSet).map((dirPath) => ({
					path: dirPath,
					type: "folder" as const,
					label: path.basename(dirPath),
				}))

				// Combine files and directories and resolve.
				resolve([...fileResults, ...dirResults])
			}
		})

		rgProcess.on("error", (error) => {
			reject(new Error(`ripgrep process error: ${error.message}`))
		})
	})
}

export async function executeRipgrepForFiles(
	workspacePath: string,
	limit: number = 5000,
): Promise<{ path: string; type: "file" | "folder"; label?: string }[]> {
	const args = [
		"--files",
		"--follow",
		"--hidden",
		"-g",
		"!**/node_modules/**",
		"-g",
		"!**/.git/**",
		"-g",
		"!**/out/**",
		"-g",
		"!**/dist/**",
		workspacePath,
	]

	return executeRipgrep({ args, workspacePath, limit })
}

export async function searchWorkspaceFiles(
	query: string,
	workspacePath: string,
	limit: number = 20,
): Promise<{ path: string; type: "file" | "folder"; label?: string }[]> {
	try {
		// Get all files and directories (from our modified function)
		const allItems = await executeRipgrepForFiles(workspacePath, 5000)

		// If no query, just return the top items
		if (!query.trim()) {
			return allItems.slice(0, limit)
		}

		// Create search items for all files AND directories
		const searchItems = allItems.map((item) => ({
			original: item,
			searchStr: `${item.path} ${item.label || ""}`,
		}))

		// Run fzf search on all items
		const fzf = new Fzf(searchItems, {
			selector: (item) => item.searchStr,
			tiebreakers: [byLengthAsc],
			limit: limit,
		})

		// Get all matching results from fzf
		const fzfResults = fzf.find(query).map((result) => result.item.original)

		// Verify types of the shortest results
		const verifiedResults = await Promise.all(
			fzfResults.map(async (result) => {
				const fullPath = path.join(workspacePath, result.path)
				// Verify if the path exists and is actually a directory
				if (fs.existsSync(fullPath)) {
					const isDirectory = fs.lstatSync(fullPath).isDirectory()
					return {
						...result,
						path: result.path.toPosix(),
						type: isDirectory ? ("folder" as const) : ("file" as const),
					}
				}
				// If path doesn't exist, keep original type
				return result
			}),
		)

		return verifiedResults
	} catch (error) {
		console.error("Error in searchWorkspaceFiles:", error)
		return []
	}
}
