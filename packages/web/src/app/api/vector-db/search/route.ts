/// AI Generated content
import { NextResponse } from 'next/server';

// 模拟向量搜索结果
const mockSearchResults = [
  {
    id: '1',
    content: '信用卡年费政策：白金卡年费为3600元，金卡年费为1800元，普卡年费为200元。',
    similarity: 0.95,
    metadata: {
      source: '信用卡产品手册',
      page: 15,
      chapter: '费用说明',
      knowledge_base_id: 1
    }
  },
  {
    id: '2', 
    content: '信用卡透支利息按日利率万分之五计算，按月计收复利。',
    similarity: 0.89,
    metadata: {
      source: '信用卡业务规则',
      page: 23,
      chapter: '利息计算',
      knowledge_base_id: 1
    }
  },
  {
    id: '3',
    content: '房贷审批需要提供收入证明、征信报告、房产评估报告等材料。',
    similarity: 0.86,
    metadata: {
      source: '房贷审批流程',
      page: 8,
      chapter: '申请材料',
      knowledge_base_id: 2
    }
  }
];

// POST - 向量搜索
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, knowledge_base_ids, limit = 10, threshold = 0.7 } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '搜索查询不能为空' },
        { status: 400 }
      );
    }

    // 模拟向量搜索逻辑
    let results = [...mockSearchResults];

    // 按知识库过滤
    if (knowledge_base_ids && knowledge_base_ids.length > 0) {
      results = results.filter(result => 
        knowledge_base_ids.includes(result.metadata.knowledge_base_id)
      );
    }

    // 按相似度阈值过滤
    results = results.filter(result => result.similarity >= threshold);

    // 限制结果数量
    results = results.slice(0, limit);

    // 模拟网络延迟和向量计算时间
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({
      query,
      results,
      total: results.length,
      search_time: '0.156s',
      embedding_model: 'text-embedding-ada-002'
    });
  } catch (error) {
    console.error('向量搜索失败:', error);
    return NextResponse.json(
      { error: '向量搜索失败' },
      { status: 500 }
    );
  }
}