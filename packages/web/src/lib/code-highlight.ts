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
