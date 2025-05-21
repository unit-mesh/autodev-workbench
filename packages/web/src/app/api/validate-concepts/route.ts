import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concepts, codeContext } = body

    if (!concepts || !Array.isArray(concepts) || !codeContext) {
      return NextResponse.json(
        { error: "Invalid request. Concepts array and codeContext are required." },
        { status: 400 },
      )
    }

    try {
      const response = await fetch(new URL('/api/chat', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一个专业的领域驱动设计概念验证助手，你需要帮助验证提取的关键词是否准确、相关，并识别与项目词汇表的匹配项。'
            },
            {
              role: 'user',
              content: `请分析以下从需求文本中提取的关键词/概念，并与项目现有的词汇表进行比较，提供专业的分析并返回匹配结果。

关键词: ${concepts.join(', ')}

项目词汇表:
${codeContext}

请提供简短的分析报告，并明确指出哪些关键词与词汇表中的条目匹配或高度相关。返回格式如下：
1. matches: [匹配的关键词数组]
2. 分析结果和建议`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('调用AI验证服务失败');
      }

      const data = await response.json();

      // 从AI回复中提取匹配的关键词
      let matches: string[] = [];
      try {
        // 尝试从AI回复中提取 JSON 格式的匹配项
        const matchesPattern = /matches\s*:\s*\[(.*?)\]/i;
        const matchesMatch = data.content.match(matchesPattern);
        if (matchesMatch && matchesMatch[1]) {
          const matchesStr = matchesMatch[1].replace(/"/g, '').replace(/'/g, '');
          matches = matchesStr.split(',').map((item: string) => item.trim()).filter(Boolean);
        }
      } catch (parseError) {
        console.error('解析匹配项时出错:', parseError);
        // 发生错误时使用原始概念作为匹配项
        matches = concepts;
      }

      return NextResponse.json({
        success: true,
        message: '关键词验证完成',
        suggestions: data.content || '无具体建议',
        matches: matches,
        details: data
      });
    } catch (error) {
      console.error("验证概念时出错:", error)
      return NextResponse.json({
        success: false,
        message: '验证过程出错',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  } catch (error) {
    console.error("Error in validate-concepts API:", error)
    return NextResponse.json({ error: "Failed to validate concepts" }, { status: 500 })
  }
}
