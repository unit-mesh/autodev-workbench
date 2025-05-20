import { NextResponse } from 'next/server';
import { sql } from '@/app/api/_utils/db';

export async function GET() {
  try {
    // 获取最近的符号分析结果，使用SQL而非Prisma
    const result = await sql`
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
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;

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

    if (!data || typeof data !== 'object' || !data.symbols || !Array.isArray(data.symbols)) {
      return NextResponse.json(
        { error: '无效的数据格式。需要一个包含symbols数组的对象' },
        { status: 400 }
      );
    }

    // 存储符号分析结果
    const results = [];
    for (const symbol of data.symbols) {
      if (!symbol.name || !symbol.kind) {
        continue; // 跳过无效的符号
      }

      const result = await sql`
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
          ${symbol.name},
          ${symbol.kind},
          ${symbol.path || ''},
          ${JSON.stringify(symbol.detail || {})},
          ${projectId},
          NOW(), 
          NOW()
        ) RETURNING id
      `;
      
      if (result && result.length > 0) {
        results.push(result[0].id);
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
