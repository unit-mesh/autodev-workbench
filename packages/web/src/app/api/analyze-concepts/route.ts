import { type NextRequest, NextResponse } from "next/server"
import { reply } from "@/app/api/_utils/reply";
import { MarkdownCodeBlock } from "@/app/api/_utils/MarkdownCodeBlock";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { concepts } = body

		if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
			return NextResponse.json(
				{ error: "Invalid request. Concepts array is required." },
				{ status: 400 },
			)
		}

		const analysisResults = await analyzeConcepts(concepts)

		return NextResponse.json(analysisResults)
	} catch (error) {
		console.error("Error in analyze-concepts API:", error)
		return NextResponse.json({
			success: false,
			message: "Failed to analyze concepts",
			error: error instanceof Error ? error.message : "Unknown error"
		}, { status: 500 })
	}
}

export async function analyzeConcepts(concepts: Array<{
	id: string;
	termChinese: string;
	termEnglish: string;
	descChinese: string;
}>) {
	if (concepts.length <= 1) {
		return {
			success: true,
			duplicates: [],
			mergeSuggestions: [],
			relatedTerms: [],
			message: "概念词典中条目不足，无法优化"
		};
	}

	try {
		const prompt = `
你是一个专业的领域驱动设计专家，请分析以下概念词典中的条目，识别可能的问题并提供优化建议。

概念词典:
${concepts.map(c => `- ID: ${c.id}, 中文: ${c.termChinese}, 英文: ${c.termEnglish}, 描述: ${c.descChinese}`).join('\n')}

请执行以下分析:
1. 识别重复的概念（完全相同或非常相似的条目）
2. 识别可以合并的相关概念（表达相同或相似意思的不同术语）
3. 识别相关的术语（例如，一个术语是另一个术语的组成部分，或者它们之间存在层级关系或依赖关系），并建议如何关联它们。
4. 提供优化建议

请以JSON格式返回结果:
{
  "duplicates": [
    {
      "group": [{"id": "id1", "term": "术语1"}, {"id": "id2", "term": "术语2"}],
      "reason": "解释为什么这些是重复的",
      "recommendation": "保留哪个术语的建议"
    }
  ],
  "mergeSuggestions": [
    {
      "group": [{"id": "id1", "term": "术语1"}, {"id": "id2", "term": "术语2"}],
      "reason": "解释为什么这些可以合并",
      "mergedTerm": {
        "termChinese": "建议的中文术语",
        "termEnglish": "建议的英文术语",
        "descChinese": "建议的描述",
        "relatedTerms": ["id2", "id3"]
      }
    }
  ],
  "analysis": "整体分析和建议"
}`;

		const text = await reply([{
			role: 'user',
			content: prompt,
		}]);

		const response = JSON.parse(MarkdownCodeBlock.from(text)[0]?.code || text);

		return {
			success: true,
			duplicates: response.duplicates || [],
			mergeSuggestions: response.mergeSuggestions || [],
			analysis: response.analysis || "",
			message: "概念词典分析完成"
		};
	} catch (error) {
		console.error("分析概念词典时出错:", error);
		return {
			success: false,
			message: "分析概念词典时出错",
			error: error instanceof Error ? error.message : "未知错误"
		};
	}
}
