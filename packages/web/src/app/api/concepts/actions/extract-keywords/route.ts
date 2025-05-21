import { type NextRequest, NextResponse } from "next/server"
import { reply } from "@/app/api/_utils/reply";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, systemPrompt } = body

    if (!text) {
      return NextResponse.json(
        { error: "Invalid request. Text is required." },
        { status: 400 },
      )
    }

    const keywords = await extractKeywords(text, systemPrompt)

    return NextResponse.json({
      success: true,
      keywords,
    })
  } catch (error) {
    console.error("Error in extract-keywords API:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to extract keywords",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function extractKeywords(text: string, systemPrompt?: string) {
  try {
    const keywordPrompt = `
Analyze the following text and extract key technical concepts and domain terms that would be useful for code searching.

GUIDELINES:
- Extract terms exactly as they would appear in code (variables, functions, class names, etc.)
- Include technical terms, domain concepts, and programming patterns
- For compound terms, provide both camelCase and kebab-case versions when appropriate
- Focus on specific, concrete terms rather than general concepts
- Prioritize nouns and noun phrases that would appear in variable or function names
- Include abbreviated forms if they might be used in code

Return ONLY a JSON array of strings with the extracted keywords.
Example: ["userId", "user-id", "authService", "auth-service", "JWT", "authentication", "bcrypt"]

Text to analyze:
${text}
`;

    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: keywordPrompt }
    ];

    const responseText = await reply(messages);

    let keywords: string[] = [];
    const cleanedText = responseText.replace(/```[\s\S]*?```/g, (match: string) => {
      return match.replace(/```[\w]*\n|\n```/g, '');
    });

    if (cleanedText.includes("[") && cleanedText.includes("]")) {
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          keywords = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Error parsing JSON array:", e);
        }
      }
    }

    if (keywords.length === 0) {
      keywords = cleanedText
        .split(/[,\n]/)
        .map((k: string) => k.trim())
        .filter((k: string) => k && !k.startsWith('"') && !k.startsWith('[') && !k.startsWith(']'));
    }

    return keywords;
  } catch (error) {
    console.error("Error extracting keywords:", error);
    throw error;
  }
}
