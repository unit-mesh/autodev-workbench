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

    const enrichedRequirement = await enrichRequirement(text, systemPrompt)

    return NextResponse.json({
      success: true,
      text: enrichedRequirement,
    })
  } catch (error) {
    console.error("Error in requirements enrichment API:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to enrich requirement",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function enrichRequirement(text: string, systemPrompt?: string) {
  try {
    const enrichPrompt = `
As a requirements specialist, please enrich the following requirement with more context and details.

GUIDELINES:
- Maintain the original intent but add missing details and context
- Consider various user scenarios and edge cases
- Add technical considerations that would be helpful for implementation
- Include non-functional requirements like performance, security, scalability
- Structure the response in clear paragraphs with logical flow
- Add specific examples of user interactions where appropriate
- Keep the language clear, specific, and actionable
- Preserve domain-specific terminology from the original text

Original requirement:
${text}

Please provide an enriched version that maintains the original intent but adds context and clarity.
`;

    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: enrichPrompt }
    ];

    const responseText = await reply(messages);
    return responseText;
  } catch (error) {
    console.error("Error enriching requirement:", error);
    throw error;
  }
}
