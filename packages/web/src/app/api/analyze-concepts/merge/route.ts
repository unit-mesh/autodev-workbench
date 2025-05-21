import { NextResponse } from "next/server";
import { sql, transaction, query } from "../../_utils/db";

export async function POST(request: Request) {
  try {
    const { conceptIds, mergedTerm } = await request.json();

    if (!conceptIds || !Array.isArray(conceptIds) || conceptIds.length < 2) {
      return NextResponse.json(
        { success: false, message: "至少需要提供两个概念ID才能进行合并" },
        { status: 400 }
      );
    }

    // 1. 获取要合并的概念 - 使用正确的query函数
    const placeholders = conceptIds.map((_, i) => `$${i + 1}`).join(', ');
    const queryText = `SELECT * FROM "ConceptDictionary" WHERE id IN (${placeholders})`;
    const concepts = await query(queryText, conceptIds);

    if (concepts.length !== conceptIds.length) {
      return NextResponse.json(
        { success: false, message: "一个或多个概念ID无效" },
        { status: 400 }
      );
    }

    // 2. 如果没有提供合并后的术语，使用第一个概念作为基础
    const baseConcept = concepts[0];
    const now = new Date();

    // 3. 创建合并后的概念
    const mergedConcept = {
      termChinese: mergedTerm?.termChinese || baseConcept.termChinese,
      termEnglish: mergedTerm?.termEnglish || baseConcept.termEnglish,
      descChinese: mergedTerm?.descChinese || baseConcept.descChinese,
    };

    // 4. 使用事务保证原子性
    const result = await transaction(async (client) => {
      // 4.1 创建新的合并后概念
      const newConceptResult = await client.query(
        `INSERT INTO "ConceptDictionary" (
          "termChinese",
          "termEnglish",
          "descChinese", 
          "createdAt",
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          mergedConcept.termChinese,
          mergedConcept.termEnglish,
          mergedConcept.descChinese,
          now,
          now
        ]
      );

      // 4.2 删除原来的概念
      await client.query(
        `DELETE FROM "ConceptDictionary" WHERE id IN (${placeholders})`,
        conceptIds
      );

      return newConceptResult.rows;
    });

    return NextResponse.json({
      success: true,
      message: "概念已成功合并",
      mergedConcept: result[0],
    });
  } catch (error) {
    console.error("合并概念时出错:", error);
    return NextResponse.json(
      {
        success: false,
        message: "合并概念时出错",
        error: error instanceof Error ? error.message : "未知错误"
      },
      { status: 500 }
    );
  }
}
