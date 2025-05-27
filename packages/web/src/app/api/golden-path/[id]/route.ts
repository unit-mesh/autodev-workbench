import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configId = (await params).id;

    const config = await prisma.goldenPathConfig.findUnique({
      where: { id: configId },
      include: {
        project: {
          select: {
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: '配置不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('获取Golden Path配置失败:', error);
    const errorResponse = {
      error: '获取配置失败',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error)
      })
    };
    return NextResponse.json(
      errorResponse, { status: 500 }
    );
  }
}
