import { NextResponse } from "next/server";
import { generateId, sql, transaction } from '@/app/api/_utils/db';

export type ApiResource = {
	id?: string;
	systemId?: string;
	sourceUrl: string;
	sourceHttpMethod: string;
	packageName: string;
	className: string;
	methodName: string;
	supplyType: string;
}

export async function GET() {
	try {
		const rows = await sql`
			SELECT 
				a.*,
				p.name as "projectName"
			FROM 
				"ApiResource" a
			LEFT JOIN 
				"Project" p ON a."projectId" = p.id
			ORDER BY 
				a.id DESC
		`;

		return NextResponse.json(rows);
	} catch (error) {
		console.error('获取API资源列表失败:', error);
		return NextResponse.json(
			{ error: '获取API资源列表失败' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();

		// 验证必要字段
		if (!body.name || !body.swaggerJson) {
			return NextResponse.json(
				{ error: 'API名称和Swagger JSON是必填项' },
				{ status: 400 }
			);
		}

		// 插入新API资源，移除createdAt和updatedAt字段
		const result = await sql`
			INSERT INTO "ApiResource" (
				"name",
				"description",
				"swaggerJson",
				"version",
				"baseUrl",
				"projectId"
			) VALUES (
				${body.name},
				${body.description || ''},
				${body.swaggerJson},
				${body.version || '1.0.0'},
				${body.baseUrl || ''},
				${body.projectId}
			) RETURNING *
		`;

		return NextResponse.json(result[0]);
	} catch (error) {
		console.error('创建API资源失败:', error);
		return NextResponse.json(
			{ error: '创建API资源失败' },
			{ status: 500 }
		);
	}
}
