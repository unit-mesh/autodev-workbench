import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

// 获取单个规范
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = createClient();
  try {
    await client.connect();
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的规范ID' },
        { status: 400 }
      );
    }

    const { rows } = await client.sql`
      SELECT * FROM "Guideline" 
      WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: '找不到规范' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('获取规范详情失败:', error);
    return NextResponse.json(
      { error: '获取规范详情失败' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// 更新规范
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = createClient();
  try {
    await client.connect();
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的规范ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 检查该规范是否存在
    const { rows: existingRows } = await client.sql`
      SELECT * FROM "Guideline" 
      WHERE id = ${id}
    `;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: '找不到规范' },
        { status: 404 }
      );
    }

    // 将对象转换为JSON字符串
    const categoryJson = JSON.stringify(body.category);
    const now = new Date();
    
    // 更新规范
    const { rows } = await client.sql`
      UPDATE "Guideline" 
      SET 
        "title" = ${body.title}, 
        "description" = ${body.description || ''}, 
        "category" = ${categoryJson}, 
        "language" = ${body.language || 'general'}, 
        "content" = ${body.content}, 
        "version" = ${body.version || '1.0.0'}, 
        "lastUpdated" = ${now}, 
        "popularity" = ${body.popularity || 0}, 
        "status" = ${body.status || 'DRAFT'}, 
        "updatedAt" = ${now}
      WHERE id = ${id} 
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('更新规范失败:', error);
    return NextResponse.json(
      { error: '更新规范失败' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// 删除规范
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = createClient();
  try {
    await client.connect();
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的规范ID' },
        { status: 400 }
      );
    }

    // 检查该规范是否存在
    const { rows: existingRows } = await client.sql`
      SELECT * FROM "Guideline" 
      WHERE id = ${id}
    `;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: '找不到规范' },
        { status: 404 }
      );
    }

    // 删除规范
    await client.sql`
      DELETE FROM "Guideline" 
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除规范失败:', error);
    return NextResponse.json(
      { error: '删除规范失败' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
