/// AI Generated content
import { NextResponse } from 'next/server';

// 模拟知识库详细数据（这里可以包含更多详情）
const getKnowledgeBaseDetail = (id: number) => {
  const mockDetails = {
    1: {
      id: 1,
      title: '信用卡产品知识库',
      description: '包含信用卡产品规则、费率说明、风控策略和客户服务流程的向量化知识库',
      type: 'business',
      size: '2.5GB',
      vectors: '1.2M',
      iconName: 'FileText',
      author: {
        name: '信用卡中心',
        handle: '@credit-card-team',
        avatar: '/images/avatars/credit-card.png',
        verified: true
      },
      createdAt: '2024-01-15T08:00:00.000Z',
      updatedAt: '2024-01-20T10:30:00.000Z',
      status: 'active',
      embedding_model: 'text-embedding-ada-002',
      chunk_size: 1000,
      chunk_overlap: 200,
      documents_count: 2847,
      tags: ['信用卡', '金融产品', '风控', '客服'],
      metrics: {
        search_queries: 15420,
        avg_response_time: '0.15s',
        accuracy_score: 0.94
      }
    },
    // 可以继续添加其他知识库的详细信息
  };

  return mockDetails[id as keyof typeof mockDetails] || null;
};

// GET - 获取单个知识库详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的知识库ID' },
        { status: 400 }
      );
    }

    const knowledgeBase = getKnowledgeBaseDetail(id);

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: '知识库不存在' },
        { status: 404 }
      );
    }

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json(knowledgeBase);
  } catch (error) {
    console.error('获取知识库详情失败:', error);
    return NextResponse.json(
      { error: '获取知识库详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新知识库
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    const body = await request.json();
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的知识库ID' },
        { status: 400 }
      );
    }

    const knowledgeBase = getKnowledgeBaseDetail(id);

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: '知识库不存在' },
        { status: 404 }
      );
    }

    // 模拟更新操作
    const updatedKnowledgeBase = {
      ...knowledgeBase,
      ...body,
      updatedAt: new Date().toISOString()
    };

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 400));

    return NextResponse.json(updatedKnowledgeBase);
  } catch (error) {
    console.error('更新知识库失败:', error);
    return NextResponse.json(
      { error: '更新知识库失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除知识库
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的知识库ID' },
        { status: 400 }
      );
    }

    const knowledgeBase = getKnowledgeBaseDetail(id);

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: '知识库不存在' },
        { status: 404 }
      );
    }

    // 模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(
      { message: '知识库删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除知识库失败:', error);
    return NextResponse.json(
      { error: '删除知识库失败' },
      { status: 500 }
    );
  }
}