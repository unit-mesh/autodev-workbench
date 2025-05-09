import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';
export async function POST(request: Request) {
  const client = createClient();
  await client.connect();

  try {
    const data = await request.json()

    // Store the data in the database using SQL
    const result = await client.sql`
      INSERT INTO "CodeAnalysis" (
        id, 
        path,
        content,
        "createdAt", 
        "updatedAt"
      ) VALUES (
        gen_random_uuid(), 
        ${data.path},
        ${data.content},
        NOW(), 
        NOW()
      ) RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: 'Code analysis result stored successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error processing code analysis result:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process code analysis result',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
