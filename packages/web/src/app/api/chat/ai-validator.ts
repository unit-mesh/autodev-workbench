import { reply } from "@/app/api/_utils/reply"
import { MarkdownCodeBlock } from "@/app/api/_utils/MarkdownCodeBlock";

export interface ConceptValidationResults {
  validConcepts: string[]
  invalidConcepts: { term: string; reason: string }[]
}

/**
 * Uses AI to validate if extracted terms are actual domain concepts
 */
export async function validateConcepts(
  extractedTerms: string[],
  codeContext: string,
): Promise<ConceptValidationResults> {
  if (extractedTerms.length === 0) {
    return { validConcepts: [], invalidConcepts: [] }
  }

  const prompt = `
You are an expert software developer analyzing code to identify domain-specific concepts.
Given the following code context and extracted terms, determine which terms are valid domain concepts and which are not.

CODE CONTEXT:
\`\`\`
${codeContext}
\`\`\`

EXTRACTED TERMS:
${extractedTerms.join(", ")}

For each term, determine if it's a valid domain concept or not. A valid domain concept is a term that:
1. Represents a meaningful entity, action, or concept in the business/application domain
2. Is not a generic programming term (like "function", "class", "parameter")
3. Is not a common English word without specific domain meaning
4. Is not a variable name that doesn't represent a domain concept
5. Is not a common programming term without specific domain meaning, like "loop", "array", "controller", "service", "result", etc.

Respond in the following JSON format:
{
  "results": [
    {"term": "term1", "isValid": true, "reason": "Explanation why it's a valid concept"},
    {"term": "term2", "isValid": false, "reason": "Explanation why it's not a valid concept"}
  ]
}
`

  try {
    const text = await reply([{
      role: 'user',
      content: prompt,
    }])

    const response = JSON.parse(MarkdownCodeBlock.from(text)[0].code)
    const validConcepts: string[] = []
    const invalidConcepts: { term: string; reason: string }[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.results.forEach((result: any) => {
      if (result.isValid) {
        validConcepts.push(result.term)
      } else {
        invalidConcepts.push({ term: result.term, reason: result.reason })
      }
    })

    return { validConcepts, invalidConcepts }
  } catch (error) {
    console.error("Error validating concepts with AI:", error)
    // If AI validation fails, return all concepts as valid
    return {
      validConcepts: extractedTerms,
      invalidConcepts: [],
    }
  }
}

/**
 * 使用大语言模型验证提取的概念
 * @param concepts 提取的关键词/概念
 * @param codeContext 项目上下文，如词汇表数据
 */
export async function validateDictConcepts(concepts: string[], codeContext: string) {
  try {
    const response = await reply([
      {
        role: 'system',
        content: '你是一个专业的领域驱动设计概念验证助手，你需要帮助验证提取的关键词是否准确、相关，并提供改进建议。'
      },
      {
        role: 'user',
        content: `请分析以下从需求文本中提取的关键词/概念，并与项目现有的词汇表进行比较，提供专业的分析和建议。

关键词: ${concepts.join(', ')}

项目词汇表:
${codeContext}
            
请提供简短的分析报告：
1. 这些关键词是否准确地代表了领域概念
2. 是否有任何词义模糊或歧义的概念需要澄清
3. 与现有词汇表的整合建议
4. 其他可能缺失的相关概念`
      }
    ]);

    return {
      success: true,
      message: '关键词验证完成',
      suggestions: response || '无具体建议',
      details: response
    };
  } catch (error) {
    console.error('验证概念时出错:', error);
    return {
      success: false,
      message: '验证过程出错',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 使用AI分析概念词典，查找重复、相似或可合并的概念
 * @param concepts 概念词典列表
 */
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
      message: "概念词典中条目不足，无���优化"
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
3. 提供优化建议

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
        "descChinese": "建议的描述"
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
