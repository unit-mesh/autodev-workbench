import {NextResponse} from 'next/server';
import {Status} from '@prisma/client';
import {prisma} from "../../../../../prisma/prisma";

export async function GET(request: Request, {params}: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await params).id);
        if (isNaN(id)) {
            return NextResponse.json(
                {error: '无效的规范ID'},
                {status: 400}
            );
        }

        const guideline = await prisma.guideline.findUnique({
            where: {id}
        });

        if (!guideline) {
            return NextResponse.json(
                {error: '找不到规范'},
                {status: 404}
            );
        }

        return NextResponse.json(guideline);
    } catch (error) {
        console.error('获取规范详情失败:', error);
        return NextResponse.json(
            {error: '获取规范详情失败'},
            {status: 500}
        );
    }
}

export async function PUT(request: Request, {params}: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await params).id);
        if (isNaN(id)) {
            return NextResponse.json(
                {error: '无效的规范ID'},
                {status: 400}
            );
        }

        const body = await request.json();

        // 检查规范是否存在
        const existingGuideline = await prisma.guideline.findUnique({
            where: {id}
        });

        if (!existingGuideline) {
            return NextResponse.json(
                {error: '找不到规范'},
                {status: 404}
            );
        }

        // 更新规范
        const updatedGuideline = await prisma.guideline.update({
            where: {id},
            data: {
                title: body.title,
                description: body.description || '',
                category: body.category,
                language: body.language || 'general',
                content: body.content,
                version: body.version || '1.0.0',
                lastUpdated: new Date(),
                popularity: body.popularity || 0,
                status: (body.status as Status) || 'DRAFT',
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updatedGuideline);
    } catch (error) {
        console.error('更新规范失败:', error);
        return NextResponse.json(
            {error: '更新规范失败'},
            {status: 500}
        );
    }
}

export async function DELETE(request: Request, {params}: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await params).id);
        if (isNaN(id)) {
            return NextResponse.json(
                {error: '无效的规范ID'},
                {status: 400}
            );
        }

        // 检查规范是否存在
        const existingGuideline = await prisma.guideline.findUnique({
            where: {id}
        });

        if (!existingGuideline) {
            return NextResponse.json(
                {error: '找不到规范'},
                {status: 404}
            );
        }

        // 删除规范
        await prisma.guideline.delete({
            where: {id}
        });

        return NextResponse.json({success: true});
    } catch (error) {
        console.error('删除规范失败:', error);
        return NextResponse.json(
            {error: '删除规范失败'},
            {status: 500}
        );
    }
}