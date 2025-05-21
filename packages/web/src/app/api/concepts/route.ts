import { NextResponse } from 'next/server';
import { sql } from '../_utils/db';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    console.error('创建词汇表表条目失败:', error);
    return NextResponse.json(
      { error: '创建词汇表条目失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const result = await sql`
        DELETE FROM "ConceptDictionary"
        WHERE id = ${id}
        RETURNING id
      `;

      if (result.length === 0) {
        return NextResponse.json(
          { error: '未找到指定的概念词典条目' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, id: result[0].id });
    }

    const body = await request.json();
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await sql`
        DELETE FROM "ConceptDictionary"
        WHERE id IN ${sql(body.ids)}
        RETURNING id
      `;

      return NextResponse.json({
        success: true,
        deletedCount: result.length,
        deletedIds: result.map(row => row.id)
      });
    }

    return NextResponse.json(
      { error: '删除请求无效，需要提供id参数或ids数组' },
      { status: 400 }
    );
  } catch (error) {
    console.error('删除词汇表条目失败:', error);
    return NextResponse.json(
      { error: '删除词汇表条目失败' },
      { status: 500 }
    );
  }
}
