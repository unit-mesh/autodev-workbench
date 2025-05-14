/// AI Generate
import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';
import { reply } from "@/app/api/_utils/reply";
import { MarkdownCodeBlock } from "@/app/api/_utils/MarkdownCodeBlock";

export const maxDuration = 60;

interface CodeAnalysis {
  title: string;
  description: string;
  language: string;
}

async function generateAIAnalysis(path: string, content: string): Promise<CodeAnalysis> {
  const answer = await reply([
    {
      role: "user",
      content: `分析以下代码文件的内容，生成英语的代码分析信息。
要求如下：      
1. 请根据代码内容分析其主要功能和用途
2. 生成一个简短的语的标题，突出代码的主要功能
3. 生成一段语的描述，说明代码的具体实现和用途
4. 识别代码使用的编程语言

请按照以下格式返回（JSON格式）：
{
  "title": "简短的标题",
  "description": "详细的描述",
  "language": "编程语言"
}

文件路径：${path}
代码内容：
${content}

请生成分析：   
`,
    },
  ]);

  try {
    const text = MarkdownCodeBlock.from(answer)[0].code;
    const parse = JSON.parse(text);
    return parse as CodeAnalysis;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.warn(answer)
    throw new Error('Failed to parse AI response');
  }
}

export async function POST() {
  const client = createClient();
  await client.connect();

  try {
    const { rows: codeAnalyses } = await client.sql`
      SELECT id, path, content
      FROM "CodeAnalysis"
      WHERE description IS NULL
    `;

    await Promise.all(codeAnalyses.map(async (analysis) => {
      let analysisResult: CodeAnalysis;
      try {
        analysisResult = await generateAIAnalysis(analysis.path, analysis.content);
      } catch (error) {
        console.error('Error generating analysis:', error);
        return analysis;
      }

      const result = await client.sql`
        UPDATE "CodeAnalysis"
        SET 
          title = ${analysisResult.title},
          description = ${analysisResult.description},
          language = ${analysisResult.language}
        WHERE id = ${analysis.id}
      `;

      return result.rows[0];
    }));

    console.log('Updated all code analyses with descriptions');
    return NextResponse.json({ success: true, message: 'Analysis generated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in batch generating analysis:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Error batch generating analysis",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
