import { NextResponse } from 'next/server';
import { pool } from '../../_utils/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords');

    // If keywords are provided, filter the results
    if (keywords && keywords.trim() !== '') {
      const keywordArray = keywords.split(',').map(k => k.trim());

      // Create dynamic queries using SQL template literals
      let conditions = [];
      for (const keyword of keywordArray) {
        const pattern = `%${keyword}%`;
        const result = await pool.sql`
          SELECT 
            id,
            path,
            content,
            title,
            description,
            source,
            language,
            "createdAt",
            "updatedAt"
          FROM "CodeAnalysis"
          WHERE 
            path ILIKE ${pattern} OR
            content ILIKE ${pattern} OR
            title ILIKE ${pattern} OR
            description ILIKE ${pattern}
        `;
        conditions.push(result.rows);
      }

      // Combine results and remove duplicates
      const allResults = [].concat(...conditions);
      const uniqueIds = new Set();
      const uniqueResults = allResults.filter(item => {
        if (!uniqueIds.has(item.id)) {
          uniqueIds.add(item.id);
          return true;
        }
        return false;
      });

      // Sort by createdAt and limit to 50
      const sortedResults = uniqueResults.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 50);

      return NextResponse.json(sortedResults);
    }

    // Default query without keywords
    const result = await pool.sql`
      SELECT 
        id,
        path,
        content,
        title,
        description,
        source,
        language,
        "createdAt",
        "updatedAt"
      FROM "CodeAnalysis"
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching code analysis results:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch code analysis results',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { data, projectId } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of analysis results' },
        { status: 400 }
      );
    }

    // Validate each item in the array
    for (const item of data) {
      if (!item.path || !item.content) {
        return NextResponse.json(
          { error: 'Each item must contain path and content fields' },
          { status: 400 }
        );
      }
    }

    // Store each item in the database
    const results = [];
    for (const item of data) {
      const result = await pool.sql`
        INSERT INTO "CodeAnalysis" (
          id, 
          path,
          content,
          "projectId",
          "createdAt", 
          "updatedAt"
        ) VALUES (
          gen_random_uuid(), 
          ${item.path},
          ${item.content},
          ${projectId},
          NOW(), 
          NOW()
        ) RETURNING id
      `;
      results.push(result.rows[0].id);
    }

    return NextResponse.json({
      success: true,
      message: 'Code analysis results stored successfully',
      ids: results
    });
  } catch (error) {
    console.error('Error processing code analysis results:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process code analysis results',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
