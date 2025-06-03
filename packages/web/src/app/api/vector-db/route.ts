/// AI Generated content
import { NextResponse } from 'next/server';

// 模拟向量知识库数据
const mockKnowledgeBases = [
  {
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
    updatedAt: '2024-01-20T10:30:00.000Z'
  },
  {
    id: 2,
    title: '房贷审批知识库',
    description: '房贷审批流程、风险评估模型、政策法规和客户资质要求的向量化集合',
    type: 'business',
    size: '1.8GB',
    vectors: '850K',
    iconName: 'Building2',
    author: {
      name: '房贷业务部',
      handle: '@mortgage-team',
      avatar: '/images/avatars/mortgage.png',
      verified: true
    },
    createdAt: '2024-01-10T09:15:00.000Z',
    updatedAt: '2024-01-18T14:20:00.000Z'
  },
  {
    id: 3,
    title: '反洗钱规则库',
    description: '反洗钱法规、可疑交易识别规则、客户尽职调查指南的向量化知识库',
    type: 'compliance',
    size: '4.2GB',
    vectors: '2.1M',
    iconName: 'Shield',
    author: {
      name: '合规部',
      handle: '@compliance-team',
      avatar: '/images/avatars/compliance.png',
      verified: true
    },
    createdAt: '2024-01-05T11:00:00.000Z',
    updatedAt: '2024-01-22T16:45:00.000Z'
  },
  {
    id: 4,
    title: '财富管理产品库',
    description: '理财产品说明书、投资策略、风险评估和收益分析的向量化集合',
    type: 'business',
    size: '1.5GB',
    vectors: '750K',
    iconName: 'PieChart',
    author: {
      name: '财富管理部',
      handle: '@wealth-team',
      avatar: '/images/avatars/wealth.png',
      verified: true
    },
    createdAt: '2024-01-08T13:30:00.000Z',
    updatedAt: '2024-01-19T09:10:00.000Z'
  },
  {
    id: 5,
    title: '保险产品知识库',
    description: '保险产品条款、理赔规则、风险评估和客户服务流程的向量化知识库',
    type: 'business',
    size: '3.1GB',
    vectors: '1.5M',
    iconName: 'Shield',
    author: {
      name: '保险业务部',
      handle: '@insurance-team',
      avatar: '/images/avatars/insurance.png',
      verified: true
    },
    createdAt: '2024-01-12T15:45:00.000Z',
    updatedAt: '2024-01-21T11:20:00.000Z'
  },
  {
    id: 6,
    title: '外汇交易规则库',
    description: '外汇交易规则、汇率计算、风险控制和交易流程的向量化知识库',
    type: 'business',
    size: '2.8GB',
    vectors: '1.3M',
    iconName: 'TrendingUp',
    author: {
      name: '外汇交易部',
      handle: '@forex-team',
      avatar: '/images/avatars/forex.png',
      verified: true
    },
    createdAt: '2024-01-14T10:20:00.000Z',
    updatedAt: '2024-01-23T13:55:00.000Z'
  },
  {
    id: 7,
    title: '企业信贷知识库',
    description: '企业信贷评估、授信规则、担保要求和贷后管理的向量化集合',
    type: 'business',
    size: '3.5GB',
    vectors: '1.8M',
    iconName: 'Building2',
    author: {
      name: '企业金融部',
      handle: '@corporate-team',
      avatar: '/images/avatars/corporate.png',
      verified: true
    },
    createdAt: '2024-01-07T14:10:00.000Z',
    updatedAt: '2024-01-24T08:30:00.000Z'
  }
];

// GET - 获取知识库列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredBases = [...mockKnowledgeBases];

    // 搜索过滤
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase();
      filteredBases = filteredBases.filter(base =>
        base.title.toLowerCase().includes(searchTerm) ||
        base.description.toLowerCase().includes(searchTerm) ||
        base.author.name.toLowerCase().includes(searchTerm)
      );
    }

    // 类型过滤
    if (type && type !== 'all') {
      filteredBases = filteredBases.filter(base => base.type === type);
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBases = filteredBases.slice(startIndex, endIndex);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      data: paginatedBases,
      pagination: {
        page,
        limit,
        total: filteredBases.length,
        totalPages: Math.ceil(filteredBases.length / limit)
      }
    });
  } catch (error) {
    console.error('获取向量知识库失败:', error);
    return NextResponse.json(
      { error: '获取向量知识库失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新知识库
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.title || !body.description || !body.type) {
      return NextResponse.json(
        { error: '标题、描述和类型是必填字段' },
        { status: 400 }
      );
    }

    // 生成新的知识库
    const newKnowledgeBase = {
      id: mockKnowledgeBases.length + 1,
      title: body.title,
      description: body.description,
      type: body.type,
      size: body.size || '0MB',
      vectors: body.vectors || '0',
      iconName: body.iconName || 'Database',
      author: body.author || {
        name: '系统用户',
        handle: '@system',
        avatar: '/images/avatars/system.png',
        verified: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 模拟添加到数据库
    mockKnowledgeBases.push(newKnowledgeBase);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(newKnowledgeBase, { status: 201 });
  } catch (error) {
    console.error('创建向量知识库失败:', error);
    return NextResponse.json(
      { error: '创建向量知识库失败' },
      { status: 500 }
    );
  }
}