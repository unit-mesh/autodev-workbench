import { NextResponse } from "next/server";
import { generateText } from "ai";
import { configureModelProvider } from "@/app/api/_utils/llm-provider";

const { fullModel, openai } = configureModelProvider();

export async function POST(req: Request) {
  try {
    const { document } = await req.json();

    if (!document) {
      return NextResponse.json(
        { error: "Missing required document field" },
        { status: 400 }
      );
    }

    // 创建分析提示词
    const qualityCheckPrompt = 
      "作为需求质量审查专家，请分析以下需求文档并找出潜在的问题。" +
      "重点关注：\n" +
      "1. 需求的模糊性和歧义\n" +
      "2. 需求的可测试性\n" +
      "3. 需求的完整性和一致性\n" +
      "4. 需求的可追溯性\n\n" +
      "请以JSON格式返回分析结果，格式如下：\n" +
      `[
        {
          "id": "qa-唯一ID",
          "type": "问题类型（ambiguity/testability/completeness/consistency）",
          "message": "详细说明问题",
          "relatedReqId": "相关需求ID"
        }
      ]` +
      "\n\n以下是需求文档：\n\n" + document;

    // 调用 AI 分析需求质量
    const result = await generateText({
      model: openai(fullModel),
      messages: [
        { role: "system", content: "你是一位需求质量审查专家。请以JSON格式返回分析结果。" },
        { role: "user", content: qualityCheckPrompt }
      ],
    });

    // 尝试从响应中提取 JSON
    try {
      // 查找 JSON 格式内容
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const qualityIssues = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ qualityIssues });
      } else {
        // 如果无法提取 JSON，返回整个回复内容
        return NextResponse.json({ 
          error: "Failed to extract JSON from AI response",
          fullText: result.text 
        }, { status: 500 });
      }
    } catch (parseError) {
      return NextResponse.json({ 
        error: "Failed to parse AI response as JSON", 
        details: parseError instanceof Error ? parseError.message : "Unknown error",
        fullText: result.text
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in analyze-requirements API:", error);
    return NextResponse.json(
      { error: "Failed to analyze requirements" },
      { status: 500 }
    );
  }
}
