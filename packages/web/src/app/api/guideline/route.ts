/// AI Generated content
import { NextResponse } from 'next/server';
import { pool } from '../_utils/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords');

    if (keywords && keywords.trim() !== '') {
      const keywordArray = keywords.split(',').map(k => k.trim());
      const patterns = keywordArray.map(keyword => `%${keyword}%`);

      const result = await pool.sql`
        SELECT * FROM "Guideline"
        WHERE "title" ILIKE ${patterns[0]}
        OR "description" ILIKE ${patterns[0]}
        OR "content" ILIKE ${patterns[0]}
        ORDER BY "updatedAt" DESC
      `;

      return NextResponse.json(result.rows);
    }

    const result = await pool.sql`
      SELECT * FROM "Guideline" 
      ORDER BY "updatedAt" DESC
    `;

    return NextResponse.json(result.rows);
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

    const result = await pool.sql`
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

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('创建规范失败:', error);
    return NextResponse.json(
      { error: '创建规范失败' },
      { status: 500 }
    );
  }
}
