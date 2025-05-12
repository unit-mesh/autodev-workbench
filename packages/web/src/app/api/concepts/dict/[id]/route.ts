import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

// 获取特定项目的词汇表
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  if (!projectId) {
    return NextResponse.json(
      { error: '需要项目ID' },
      { status: 400 }
    );
  }

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
      WHERE "projectId" = ${projectId}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('获取项目词汇表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取项目词汇表失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// 更新特定项目中的词汇条目
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  if (!projectId) {
    return NextResponse.json(
      { error: '需要项目ID' },
      { status: 400 }
    );
  }

  const client = createClient();
  await client.connect();

  try {
    const data = await request.json();

    if (!data || !data.id) {
      return NextResponse.json(
        { error: '需要词汇条目ID' },
        { status: 400 }
      );
    }

    const result = await client.sql`
      UPDATE "ConceptDictionary"
      SET 
        "termChinese" = ${data.termChinese},
        "termEnglish" = ${data.termEnglish},
        "descChinese" = ${data.descChinese},
        "descEnglish" = ${data.descEnglish},
        "updatedAt" = NOW()
      WHERE id = ${data.id} AND "projectId" = ${projectId}
      RETURNING id
    `;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: '未找到词汇条目或该条目不属于此项目' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '词汇条目更新成功',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('更新词汇条目失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '更新词汇条目失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// 删除特定项目中的词汇条目
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  if (!projectId) {
    return NextResponse.json(
      { error: '需要项目ID' },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const entryId = url.searchParams.get('entryId');

  if (!entryId) {
    return NextResponse.json(
      { error: '需要词汇条目ID' },
      { status: 400 }
    );
  }

  const client = createClient();
  await client.connect();

  try {
    const result = await client.sql`
      DELETE FROM "ConceptDictionary"
      WHERE id = ${entryId} AND "projectId" = ${projectId}
      RETURNING id
    `;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: '未找到词汇条目或该条目不属于此项目' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '词汇条目删除成功',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('删除词汇条目失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除词汇条目失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
