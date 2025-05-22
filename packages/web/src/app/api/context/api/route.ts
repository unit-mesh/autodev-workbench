import { NextResponse } from "next/server";
import { createClient } from "@vercel/postgres";
import { generateId } from "@/app/api/_utils/db";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const keywords = searchParams.get('keywords');

		const client = createClient();
		await client.connect();

		let query = `
        SELECT id,
               "sourceUrl",
               "sourceHttpMethod",
               "packageName",
               "className",
               "methodName",
               "supplyType"
        FROM "ApiResource"
        `;

		// If keywords are provided, add a WHERE clause to filter results
		if (keywords && keywords.trim() !== '') {
			const keywordArray = keywords.split(',').map(k => k.trim());
			query += `WHERE `;

			const conditions = keywordArray.map((_, index) => {
				return `
					"sourceUrl" ILIKE $${index + 1} OR
					"packageName" ILIKE $${index + 1} OR
					"className" ILIKE $${index + 1} OR
					"methodName" ILIKE $${index + 1}
				`;
			}).join(' OR ');

			query += `(${conditions})`;

			// Execute with parameters
			const params = keywordArray.map(k => `%${k}%`);
			const { rows } = await client.query(query, params);
			await client.end();

			return NextResponse.json(rows, {
				status: 200,
				headers: {
					'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
				}
			});
		}

		// Default query without keywords
		const { rows } = await client.sql`
        SELECT id,
               "sourceUrl",
               "sourceHttpMethod",
               "packageName",
               "className",
               "methodName",
               "supplyType"
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
					"supplyType",
					"projectId"
				)
				VALUES (
					${id}, 
					${item.sourceUrl}, 
					${item.sourceHttpMethod}, 
					${item.packageName}, 
					${item.className}, 
					${item.methodName},
					${item.supplyType},
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
