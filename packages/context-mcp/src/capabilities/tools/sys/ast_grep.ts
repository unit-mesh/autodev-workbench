import { ToolLike } from "../_typing";
import { z } from "zod";
import cpp from '@ast-grep/lang-typescript'
import { registerDynamicLanguage, parse } from '@ast-grep/napi'

export const installAstGrepTool: ToolLike = (installer) => {
	installer("ast-grep", "Search code using AST patterns", {
		pattern: z.string().describe("AST pattern to search for"),
		code: z.string().describe("Code to search in"),
		language: z.enum(['typescript', 'javascript']).default('typescript').describe("Language of the code")
	}, async ({ pattern, code, language }) => {
		try {
			registerDynamicLanguage({ cpp })
			
			const sg = parse(language, code)
			const matches = sg.root().findAll(pattern)
			
			const results = matches.map(match => ({
				text: match.text(),
				range: match.range(),
				kind: match.kind()
			}))

			return {
				content: [
					{
						type: "text",
						text: results.length > 0 
							? results.map(r => `Found match:\nText: ${r.text}\nKind: ${r.kind}\nRange: ${r.range.start}-${r.range.end}`).join('\n\n')
							: "No matches found"
					}
				]
			}
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `Error searching AST: ${error.message}`
					}
				]
			}
		}
	})
}
