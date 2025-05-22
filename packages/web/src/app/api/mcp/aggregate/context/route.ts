import { NextRequest, NextResponse } from 'next/server';
import { ApiResource, CodeAnalysis, Guideline } from '@/types/project.type';
import { pool } from '../../../_utils/db';
import { createClient } from "@vercel/postgres";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keywords = searchParams.get('keywords');
  const projectId = searchParams.get('projectId');

  try {
    const [apis, guidelines, codeSnippets] = await Promise.all([
      fetchApiResources(keywords, projectId),
      fetchGuidelines(keywords, projectId),
      fetchCodeSnippets(keywords, projectId)
    ]);

    return NextResponse.json({
      apis,
      guidelines,
      codeSnippets,
      meta: {
        totalCount: apis.length + guidelines.length + codeSnippets.length,
        apiCount: apis.length,
        guidelineCount: guidelines.length,
        codeSnippetCount: codeSnippets.length,
        keywords: keywords ? keywords.split(',') : [],
        projectId: projectId || null
      }
    });
  } catch (error) {
    console.error('Error aggregating context data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

async function fetchApiResources(keywords: string | null, projectId: string | null): Promise<ApiResource[]> {
  const client = createClient();
  await client.connect();

  try {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];
    let params: string[] = [];
    let paramIndex = 1;

    // If keywords are provided, prepare keyword conditions
    if (keywords && keywords.trim() !== '') {
      const keywordArray = keywords.split(',').map(k => k.trim());

      const keywordConditions = keywordArray.map((_, index) => {
        return `
          "sourceUrl" ILIKE $${paramIndex + index} OR
          "packageName" ILIKE $${paramIndex + index} OR
          "className" ILIKE $${paramIndex + index} OR
          "methodName" ILIKE $${paramIndex + index}
        `;
      });

      conditions.push(`(${keywordConditions.join(' OR ')})`);
      params = [...params, ...keywordArray.map(k => `%${k}%`)];
      paramIndex += keywordArray.length;
    }

    // If projectId is provided, add projectId filter
    if (projectId) {
      conditions.push(`"projectId" = $${paramIndex}`);
      params.push(projectId);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY "id"`;

    // Execute query with parameters
    const { rows } = await client.query(query, params);
    return rows as ApiResource[];
  } finally {
    await client.end();
  }
}

// Helper function to fetch guidelines
async function fetchGuidelines(keywords: string | null, projectId: string | null): Promise<Guideline[]> {
  try {
    let query = `SELECT * FROM "Guideline"`;

    const params: string[] = [];

    // Add keyword filter if provided
    if (keywords && keywords.trim() !== '') {
      const keywordArray = keywords.split(',').map(k => k.trim());
      const pattern = `%${keywordArray[0]}%`;

      query += `
        AND ("title" ILIKE $1
        OR "description" ILIKE $1
        OR "content" ILIKE $1)
      `;

      params.push(pattern);
    }

    // Add projectId filter if provided
    if (projectId) {
      query += ` AND "projectId" = $${params.length + 1}`;
      params.push(projectId);
    }

    query += ` ORDER BY "updatedAt" DESC`;

    const result = await pool.query(query, params);
    return result.rows as Guideline[];
  } catch (error) {
    console.error('Error fetching guidelines:', error);
    return [];
  }
}

async function fetchCodeSnippets(keywords: string | null, projectId: string | null): Promise<CodeAnalysis[]> {
  try {
    // If only projectId is provided without keywords
    if ((!keywords || keywords.trim() === '') && projectId) {
      const result = await pool.query(`
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
        WHERE "projectId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 50
      `, [projectId]);

      return result.rows as CodeAnalysis[];
    }

    if (keywords && keywords.trim() !== '') {
      const keywordArray = keywords.split(',').map(k => k.trim());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      for (const keyword of keywordArray) {
        const pattern = `%${keyword}%`;
        let query = `
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
            (path ILIKE $1 OR
            content ILIKE $1 OR
            title ILIKE $1 OR
            description ILIKE $1)
        `;

        const params = [pattern];

        // Add projectId filter if provided
        if (projectId) {
          query += ` AND "projectId" = $2`;
          params.push(projectId);
        }

        const result = await pool.query(query, params);
        conditions.push(result.rows);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allResults: any[] = [].concat(...conditions);
      const uniqueIds = new Set();
      const uniqueResults = allResults.filter(item => {
        if (!uniqueIds.has(item.id)) {
          uniqueIds.add(item.id);
          return true;
        }
        return false;
      });

      const sortedResults = uniqueResults.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 50);

      return sortedResults as CodeAnalysis[];
    }

    // Default query without keywords or projectId
    const result = await pool.query(`
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
    `);

    return result.rows as CodeAnalysis[];
  } catch (error) {
    console.error('Error fetching code analysis results:', error);
    return [];
  }
}
