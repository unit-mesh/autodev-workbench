import { type NextRequest, NextResponse } from "next/server"
import "globalthis/polyfill";
import { cutForSearch, load } from "nodejieba";

async function initJieba() {
  load();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  globalThis.jiebaLoaded = true;
}

async function extractConcepts(code: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (!globalThis.jiebaLoaded) {
    await initJieba();
  }

  const classRegex = /class\s+(\w+)/g
  const classes = Array.from(code.matchAll(classRegex)).map((match) => match[1])

  const methodRegex = /(?:async\s+)?(\w+)\s*\(/g
  const methods = Array.from(code.matchAll(methodRegex))
    .map((match) => match[1])
    .filter((method) => !["if", "for", "while", "switch"].includes(method))

  const commentRegex = /\/\*\*([\s\S]*?)\*\/|\/\/(.*)/g
  const comments: string = Array.from(code.matchAll(commentRegex))
    .map((match) => match[1] || match[2])
    .join(" ")

  const words = comments
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter((word) => word.length > 4)
    .filter((word) => !["param", "return", "function", "class", "method"].includes(word.toLowerCase()))

  const result = cutForSearch(comments, false).filter((word) => word.length >= 2)

  const allConcepts = [...classes, ...methods, ...words, ...result]
  const uniqueConcepts = Array.from(new Set(allConcepts))

  return uniqueConcepts.sort((a, b) => a.length - b.length)
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: "Invalid request. Concepts array and codeContext are required." },
        { status: 400 },
      )
    }

    const extractResults = await extractConcepts(code)
    return NextResponse.json(extractResults)
  } catch (error) {
    console.error("Error in validate-concepts API:", error)
    return NextResponse.json({ error: "Failed to validate concepts" }, { status: 500 })
  }
}
