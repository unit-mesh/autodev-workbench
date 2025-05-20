import { NextResponse } from "next/server";
import { createClient } from "@vercel/postgres";
import { generateId } from "@/app/api/_utils/db";

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
		const client = createClient();
		await client.connect();

		const { rows } = await client.sql`
        SELECT id,
               "sourceUrl",
               "sourceHttpMethod",
               "packageName",
               "className",
               "methodName"
        FROM "ApiResource"
        ORDER BY "id";
		`;

		await client.end();

		if (rows.length === 0) {
			return NextResponse.json([], {
				status: 200,
				headers: {
					'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
				}
			});
		}

		return NextResponse.json(rows, {
			status: 200,
			headers: {
				'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
			}
		});
	} catch (error) {
		console.error("Error fetching API resources:", error);
		return NextResponse.json(
			{ error: "Error fetching API resources", details: error },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	const client = createClient();
	await client.connect();

	try {
		const { data, projectId } = await request.json();

		if (!data || !Array.isArray(data)) {
			return NextResponse.json(
				{ error: "Invalid data format. Expected an array of analysis results" },
				{ status: 400 }
			);
		}

		for (const item of data) {
			const id = generateId()
			await client.sql`
				INSERT INTO "ApiResource" (
					"id", 
					"sourceUrl", 
					"sourceHttpMethod", 
					"packageName", 
					"className", 
					"methodName",
					"projectId"
				)
				VALUES (
					${id}, 
					${item.sourceUrl}, 
					${item.sourceHttpMethod}, 
					${item.packageName}, 
					${item.className}, 
					${item.methodName},
					${projectId}
				)
				RETURNING id;
			`;
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error inserting API resources:", error);
		return NextResponse.json(
			{ error: "Error inserting API resources", details: error },
			{ status: 500 }
		);
	} finally {
		await client.end();
	}
}
