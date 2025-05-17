/// AI Generated content
import { NextResponse } from 'next/server';
import { sql, transaction } from '../_utils/db';

// 获取所有规范
export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM "Guideline" 
      ORDER BY "updatedAt" DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('获取规范失败:', error);
    return NextResponse.json(
      { error: '获取规范失败' },
      { status: 500 }
    );
  }
}

// 创建新规范
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 确保所需字段都存在
    if (!body.title || !body.content || !body.category) {
      return NextResponse.json(
        { error: '标题、内容和分类是必填字段' },
        { status: 400 }
      );
    }

    // 将对象转换为JSON字符串
    const categoryJson = JSON.stringify(body.category);
    const now = new Date();

    const result = await sql`
      INSERT INTO "Guideline" (
        "title", 
        "description", 
        "category", 
        "language", 
        "content", 
        "version", 
        "lastUpdated", 
        "popularity", 
        "status", 
        "createdBy", 
        "createdAt", 
        "updatedAt"
      ) 
      VALUES (
        ${body.title}, 
        ${body.description || ''}, 
        ${categoryJson}, 
        ${body.language || 'general'}, 
        ${body.content}, 
        ${body.version || '1.0.0'}, 
        ${now.toDateString()}, 
        ${body.popularity || 0}, 
        ${body.status || 'DRAFT'}, 
        ${body.createdBy || 'system'}, 
        ${now.toDateString()}, 
        ${now.toDateString()}
      ) 
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('创建规范失败:', error);
    return NextResponse.json(
      { error: '创建规范失败' },
      { status: 500 }
    );
  }
}
