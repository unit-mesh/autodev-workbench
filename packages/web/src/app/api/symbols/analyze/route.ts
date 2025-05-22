import { NextResponse } from 'next/server';
import { generateId, pool } from '../../_utils/db';
import { reply } from "@/app/api/_utils/reply";
import { MarkdownCodeBlock } from "@/app/api/_utils/MarkdownCodeBlock";

export const maxDuration = 60;

interface ConceptDictionaryEntry {
  termChinese: string;
  termEnglish: string;
  descChinese: string;
  descEnglish: string;
  relatedTerms?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function analyzeSymbol(symbolName: string, symbolPath: string, symbolDetail: any): Promise<ConceptDictionaryEntry[]> {
  const answer = await reply([
    {
      role: "user",
      content: `分析以下关键代码标识信息，提取出编程中的概念/术语，并生成概念词典条目。

符号名称: ${symbolName}
文件路径: ${symbolPath}
符号详情: ${JSON.stringify(symbolDetail)}

请根据代码中的注释、函数名、类名等信息，提取最关键的概念/术语，并做初步的转换，请尽可能合并相似的概念。并按照以下格式返回（JSON格式）：

[{
  "termChinese": "中文术语名称 // 必须使用中文", 
  "termEnglish": "英文术语名称 // 请使用空格分隔单词",
  "descChinese": "详细的中文描述，解释这个概念在代码中的作用和意义",
  "descEnglish": "详细的英文描述，解释这个概念在代码中的作用和意义",
  "relatedTerms": ["相关术语1 //如果必须存在的话", "相关术语2 //如果必须存在的话"]
}]

请确保：
1. 术语名称应当简洁明了，能够准确表达概念
2. 描述应当详细，包含概念的定义、用途和重要性
3. 相关术语应当与主术语有明显的关联
4. 请尽可能合并相似的概念

请生成分析：`,
    },
  ]);

  try {
    console.log("answer", answer);
    if (answer.startsWith('[') && answer.endsWith(']')) {
      // 直接返回 JSON 数组
      return JSON.parse(answer) as ConceptDictionaryEntry[];
    }

    const text = MarkdownCodeBlock.from(answer)[0]?.code || answer;
    const parse = JSON.parse(text);
    return parse as ConceptDictionaryEntry[];
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.warn(answer);
    throw new Error('Failed to parse AI response');
  }
}

export async function POST(request: Request) {
  try {
    const { symbolId, projectId } = await request.json();

    if (!symbolId || !projectId) {
      return NextResponse.json(
        { success: false, message: "符号ID和项目ID都是必需的" },
        { status: 400 }
      );
    }

    // 获取符号数据
    const symbolResult = await pool.sql`
      SELECT id, name, path, detail FROM "SymbolAnalysis" WHERE id = ${symbolId}
    `;

    if (symbolResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "未找到符号" },
        { status: 404 }
      );
    }

    const symbolData = symbolResult.rows[0];

    // 分析符号并生成概念
    const conceptEntries = await analyzeSymbol(
      symbolData.name,
      symbolData.path,
      symbolData.detail
    );

    // 存储生成的概念ID
    const conceptIds: string[] = [];

    // 创建概念并收集ID
    for (const item of conceptEntries) {
      const conceptId = generateId();
      conceptIds.push(conceptId);

      await pool.sql`
        INSERT INTO "ConceptDictionary" (
          "id",                                         
          "termChinese",
          "termEnglish",
          "descChinese",
          "descEnglish",
          "projectId",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${conceptId},
          ${item.termChinese},
          ${item.termEnglish},
          ${item.descChinese},
          ${item.descEnglish},
          ${projectId},
          NOW(),
          NOW()
        )
      `;
    }

    // 更新符号，记录已识别的概念ID
    await pool.sql`
      UPDATE "SymbolAnalysis"
      SET "identifiedConcepts" = ${conceptIds},
          "updatedAt" = NOW()
      WHERE "id" = ${symbolId}
    `;

    return NextResponse.json({
      success: true,
      message: "关键代码标识完成，概念已添加到词典",
      concepts: conceptEntries,
      conceptIds: conceptIds
    });
  } catch (error) {
    console.error('分析符号时出错:', error);
    return NextResponse.json(
      {
        success: false,
        message: "分析符号时出错",
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
