import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from "../../../../prisma/prisma";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const configs = await prisma.goldenPathConfig.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('获取Golden Path配置失败:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    if (!body.name || !body.config) {
      return NextResponse.json(
        { error: '名称和配置内容是必填字段' },
        { status: 400 }
      );
    }

    const config = await prisma.goldenPathConfig.create({
      data: {
        name: body.name,
        description: body.description,
        metadata: body.metadata || {},
        config: body.config,
        projectId: body.projectId,
        userId: session?.user?.id,
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('保存Golden Path配置失败:', error);
    return NextResponse.json(
      { error: '保存配置失败' },
      { status: 500 }
    );
  }
}
