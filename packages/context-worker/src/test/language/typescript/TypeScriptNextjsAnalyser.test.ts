import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';

import { TestLanguageServiceProvider } from "../../TestLanguageService";
import { TypeScriptNextjsAnalyser } from "../../../code-context/typescript/TypeScriptNextjsAnalyser";

const Parser = require('web-tree-sitter');

describe('TypeScriptNextjsAnalyser', () => {
  let parser: any;
  let languageService: TestLanguageServiceProvider;
  let analyser: TypeScriptNextjsAnalyser;

  beforeEach(async () => {
    await Parser.init();
    parser = new Parser();
    languageService = new TestLanguageServiceProvider(parser);
    analyser = new TypeScriptNextjsAnalyser();
    await analyser.init(languageService);
  });

  it.skip('应该正确识别旧版 Next.js API 路由', async () => {
    const nextjsApiRoute = `import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    res.status(200).json({ name: 'John Doe' });
  } else if (req.method === 'POST') {
    // 处理 POST 请求
    res.status(201).json({ name: 'Created User' });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
  }
}`;

    const filePath = path.join('/workspace', 'pages', 'api', 'route.ts');
    await analyser.sourceCodeAnalysis(nextjsApiRoute, filePath, '/workspace');

    const resources = analyser.resources;
    expect(resources.length).toBe(1); // 默认支持所有 HTTP 方法
  });

  it.skip('应该正确识别新版 Next.js App Router API', async () => {
    const nextjsAppRouterApi = `import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET() {
  const client = createClient();
  await client.connect();

  try {
    const result = await client.sql\`
      SELECT * FROM "CodeAnalysis" ORDER BY "createdAt" DESC LIMIT 50
    \`;

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

export async function POST(request: Request) {
  const client = createClient();
  await client.connect();

  try {
    const { data } = await request.json();
    // 处理数据...
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}`;

    const filePath = path.join('/workspace', 'app', 'api', 'context', 'code', 'route.ts');
    await analyser.sourceCodeAnalysis(nextjsAppRouterApi, filePath, '/workspace');

    const resources = analyser.resources;
    expect(resources.length).toBe(2);
    expect(resources[0]).toMatchObject({
      sourceUrl: '/api/context/code',
      sourceHttpMethod: 'GET',
      methodName: 'GET',
      supplyType: 'Nextjs'
    });
    expect(resources[1]).toMatchObject({
      sourceUrl: '/api/context/code',
      sourceHttpMethod: 'POST',
      methodName: 'POST',
      supplyType: 'Nextjs'
    });
  });
});
