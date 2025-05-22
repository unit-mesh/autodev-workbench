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
Please briefly expand on this requirement while maintaining its original intent:

${text}

Add only essential missing details or context that would help with implementation.`;

    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: enrichPrompt }
    ];

    return await reply(messages);
  } catch (error) {
    console.error("Error enriching requirement:", error);
    throw error;
  }
}
