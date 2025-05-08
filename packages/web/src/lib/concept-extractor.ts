export async function extractConcepts(code: string): Promise<string[]> {
  // In a real implementation, this would use NLP/ML techniques
  // For this MVP, we'll use simple regex patterns

  // Extract class names
  const classRegex = /class\s+(\w+)/g
  const classes = Array.from(code.matchAll(classRegex)).map((match) => match[1])

  // Extract method names
  const methodRegex = /(?:async\s+)?(\w+)\s*\(/g
  const methods = Array.from(code.matchAll(methodRegex))
    .map((match) => match[1])
    .filter((method) => !["if", "for", "while", "switch"].includes(method))

  // Extract terms from comments
  const commentRegex = /\/\*\*([\s\S]*?)\*\/|\/\/(.*)/g
  const comments = Array.from(code.matchAll(commentRegex))
    .map((match) => match[1] || match[2])
    .join(" ")

  // Extract potential domain terms from comments
  // This is a very simplified version of keyword extraction
  const words = comments
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter((word) => word.length > 4)
    .filter((word) => !["param", "return", "function", "class", "method"].includes(word.toLowerCase()))

  // Combine all extracted concepts and remove duplicates
  const allConcepts = [...classes, ...methods, ...words]
  const uniqueConcepts = Array.from(new Set(allConcepts))

  // Sort by length (shorter terms first)
  return uniqueConcepts.sort((a, b) => a.length - b.length)
}
