import { NextResponse } from 'next/server';
import { sql, transaction } from '../../_utils/db';

// 获取所有词汇表条目
export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM "ConceptDictionary"
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('获取词汇表失败:', error);
    return NextResponse.json(
      { error: '获取词汇表失败' },
      { status: 500 }
    );
  }
}

// 创建新的词汇表条目
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 确保所需字段都存在
    if (!body.term || !body.definition) {
      return NextResponse.json(
        { error: '术语名称和定义是必填字段' },
        { status: 400 }
      );
    }

    const now = new Date();

    const result = await sql`
      INSERT INTO "ConceptDictionary" (
        "term",
        "definition",
        "category",
        "relatedTerms",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${body.term},
        ${body.definition},
        ${body.category || '通用'},
        ${body.relatedTerms ? JSON.stringify(body.relatedTerms) : '[]'},
        ${now},
        ${now}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('创建词汇表条目失败:', error);
    return NextResponse.json(
      { error: '创建词汇表条目失败' },
      { status: 500 }
    );
  }
}
