import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId is specified or user is logged in, get their projects
    if (userId || session?.user?.id) {
      const projects = await prisma.project.findMany({
        where: {
          userId: userId || session?.user?.id
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          guidelines: {
            select: {
              id: true,
              title: true,
              category: true,
              status: true
            }
          },
          codeAnalyses: {
            select: {
              id: true,
              title: true,
              language: true
            },
            take: 5
          },
          symbolAnalyses: {
            select: {
              id: true,
              name: true,
              detail: true,
            }
          }
        }
      });

      return NextResponse.json(projects);
    }

    // Default behavior - get all projects
    const projects = await prisma.project.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const data = await request.json();

    if (!data || !data.name) {
      return NextResponse.json(
        { error: '项目名称为必填项' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        gitUrl: data.gitUrl || "",
        liveUrl: data.liveUrl,
        jiraUrl: data.jiraUrl,
        jenkinsUrl: data.jenkinsUrl,
        devOpsInfo: data.devOpsInfo || {},
        isDefault: data.isDefault || false,
        userId: session.user.id // 关联到当前登录用户
      }
    });

    return NextResponse.json({
      success: true,
      message: '项目创建成功',
      project
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '创建项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
