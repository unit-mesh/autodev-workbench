import { NextResponse } from "next/server";
import { sql, transaction, query } from "../../_utils/db";

// Define types for the request structure
type MergeGroup = {
  conceptIds: string[];
  mergedTerm?: {
    termChinese: string;
    termEnglish: string;
    descChinese: string;
  };
};

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    // Handle both new format (array of groups) and old format (single group)
    const mergeGroups: MergeGroup[] = Array.isArray(requestData.groups)
      ? requestData.groups
      : [{ conceptIds: requestData.conceptIds, mergedTerm: requestData.mergedTerm }];

    // Validate input
    if (mergeGroups.length === 0) {
      return NextResponse.json(
        { success: false, message: "至少需要提供一个合并组" },
        { status: 400 }
      );
    }

    for (const group of mergeGroups) {
      if (!group.conceptIds || !Array.isArray(group.conceptIds) || group.conceptIds.length < 2) {
        return NextResponse.json(
          { success: false, message: "每个合并组至少需要提供两个概念ID" },
          { status: 400 }
        );
      }
    }

    // Process all merge operations within a single transaction
    const result = await transaction(async (client) => {
      const mergeResults = [];

      for (const group of mergeGroups) {
        const { conceptIds, mergedTerm } = group;

        // Get concepts for this group
        const placeholders = conceptIds.map((_, i) => `$${i + 1}`).join(', ');
        const conceptsQuery = await client.query(
          `SELECT * FROM "ConceptDictionary" WHERE id IN (${placeholders})`,
          conceptIds
        );

        const concepts = conceptsQuery.rows;

        if (concepts.length !== conceptIds.length) {
          throw new Error("一个或多个概念ID无效");
        }

        // Select the first concept to keep and update
        const keepConcept = concepts[0];
        const now = new Date();

        // Prepare merged concept data
        const mergedConcept = {
          termChinese: mergedTerm?.termChinese || keepConcept.termChinese,
          termEnglish: mergedTerm?.termEnglish || keepConcept.termEnglish,
          descChinese: mergedTerm?.descChinese || keepConcept.descChinese,
        };

        // Update the kept concept with merged information
        const updatedConceptResult = await client.query(
          `UPDATE "ConceptDictionary" 
           SET "termChinese" = $1, 
               "termEnglish" = $2, 
               "descChinese" = $3, 
               "updatedAt" = $4 
           WHERE id = $5 
           RETURNING *`,
          [
            mergedConcept.termChinese,
            mergedConcept.termEnglish,
            mergedConcept.descChinese,
            now,
            keepConcept.id
          ]
        );

        // Create list of IDs to delete (all except the first one)
        const idsToDelete = conceptIds.filter(id => id !== keepConcept.id);

        // Delete all concepts except the one we kept
        if (idsToDelete.length > 0) {
          const deletePlaceholders = idsToDelete.map((_, i) => `$${i + 1}`).join(', ');
          await client.query(
            `DELETE FROM "ConceptDictionary" WHERE id IN (${deletePlaceholders})`,
            idsToDelete
          );
        }

        mergeResults.push({
          keptId: keepConcept.id,
          deletedIds: idsToDelete,
          mergedConcept: updatedConceptResult.rows[0]
        });
      }

      return mergeResults;
    });

    return NextResponse.json({
      success: true,
      message: `已成功合并${mergeGroups.length}组概念`,
      results: result
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
