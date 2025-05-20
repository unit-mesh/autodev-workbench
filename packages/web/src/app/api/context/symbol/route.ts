import { NextResponse } from 'next/server';
import { sql } from '@/app/api/_utils/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('query') || '';
    const projectId = url.searchParams.get('projectId');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let query;

    if (searchTerm) {
      // Search within functionSummary and classSummary in the detail JSON
      query = sql`
        SELECT 
          id,
          name,
          kind,
          path,
          detail,
          "projectId",
          "createdAt",
          "updatedAt"
        FROM "SymbolAnalysis"
        WHERE (
          detail->>'functionSummary' ILIKE ${'%' + searchTerm + '%'} OR
          detail->>'classSummary' ILIKE ${'%' + searchTerm + '%'}
        )
        ${projectId ? sql`AND "projectId" = ${projectId}` : sql``}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT 
          id,
          name,
          kind,
          path,
          detail,
          "projectId",
          "createdAt",
          "updatedAt"
        FROM "SymbolAnalysis"
        WHERE "projectId" = ${projectId}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取符号分析结果失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取符号分析结果失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { data, projectId } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: '无效的数据格式。需要一个文件符号分析结果数组' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: '缺少项目ID' },
        { status: 400 }
      );
    }

    // 存储符号分析结果
    const results = [];

    for (const fileData of data) {
      if (!fileData.filePath || !fileData.symbols || !Array.isArray(fileData.symbols)) {
        continue; // 跳过格式无效的数据
      }

      const filePath = fileData.filePath;
      const classSummary = fileData.summary?.class || '';
      const functionSummary = fileData.summary?.function || '';

      // 为每个文件创建一个摘要记录
      if (classSummary || functionSummary) {
        const summaryResult = await sql`
          INSERT INTO "SymbolAnalysis" (
            id, 
            name,
            kind,
            path,
            detail,
            "projectId",
            "createdAt", 
            "updatedAt"
          ) VALUES (
            gen_random_uuid(), 
            ${`Summary for ${filePath}`},
            ${0},
            ${filePath},
            ${JSON.stringify({
              classSummary,
              functionSummary,
              totalSymbols: fileData.symbols.length
            })},
            ${projectId},
            NOW(), 
            NOW()
          ) RETURNING id
        `;

        if (summaryResult && summaryResult.length > 0) {
          results.push(summaryResult[0].id);
        }
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: '没有成功创建任何符号分析记录' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '符号分析结果存储成功',
      id: results[0], // 返回第一个ID作为主ID
      count: results.length
    });
  } catch (error) {
    console.error('处理符号分析结果失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '处理符号分析结果失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
