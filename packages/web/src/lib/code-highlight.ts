export function highlightCode(code: string, language: string): string {
  // This is a placeholder - in a real app, you'd use a proper syntax highlighter
  return code
}

// Extract code blocks from markdown
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```([a-zA-Z0-9]+)?\n([\s\S]*?)```/g
  const codeBlocks: Array<{ language: string; code: string }> = []

  let match
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || "jsx",
      code: match[2].trim(),
    })
  }

  return codeBlocks
}
