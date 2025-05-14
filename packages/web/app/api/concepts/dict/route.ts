import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

// 获取所有词汇表条目
export async function GET() {
  const client = createClient();
  await client.connect();

  try {
    const result = await client.sql`
      SELECT 
        id,
        "termChinese",
        "termEnglish",
        "descChinese",
        "descEnglish",
        "projectId",
        "createdAt",
        "updatedAt"
      FROM "ConceptDictionary"
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('获取词汇表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取词汇表失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// 创建新词汇条目
export async function POST(request: Request) {
  const client = createClient();
  await client.connect();

  try {
    const data = await request.json();

    if (!data || !data.termChinese || !data.termEnglish || !data.descChinese || !data.descEnglish) {
      return NextResponse.json(
        { error: '缺少必要字段' },
        { status: 400 }
      );
    }

    const result = await client.sql`
      INSERT INTO "ConceptDictionary" (
        id,
        "termChinese",
        "termEnglish",
        "descChinese",
        "descEnglish",
        "projectId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${data.termChinese},
        ${data.termEnglish},
        ${data.descChinese},
        ${data.descEnglish},
        ${data.projectId || null},
        NOW(),
        NOW()
      ) RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: '词汇条目创建成功',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('创建词汇条目失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '创建词汇条目失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
