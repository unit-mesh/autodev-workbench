export async function extractConcepts(code: string): Promise<string[]> {
	const classRegex = /class\s+(\w+)/g
	const classes = Array.from(code.matchAll(classRegex)).map((match) => match[1])

	const methodRegex = /(?:async\s+)?(\w+)\s*\(/g
	const methods = Array.from(code.matchAll(methodRegex))
		.map((match) => match[1])
		.filter((method) => !["if", "for", "while", "switch"].includes(method))

	const commentRegex = /\/\*\*([\s\S]*?)\*\/|\/\/(.*)/g
	const comments = Array.from(code.matchAll(commentRegex))
		.map((match) => match[1] || match[2])
		.join(" ")

	const words = comments
		.split(/\s+/)
		.map((word) => word.replace(/[^\w]/g, ""))
		.filter((word) => word.length > 4)
		.filter((word) => !["param", "return", "function", "class", "method"].includes(word.toLowerCase()))

	const allConcepts = [...classes, ...methods, ...words]
	const uniqueConcepts = Array.from(new Set(allConcepts))

	return uniqueConcepts.sort((a, b) => a.length - b.length)
}
