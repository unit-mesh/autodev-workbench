import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET() {
  const client = createClient();
  try {
    await client.connect();
    
    // 检查表是否已存在
    const { rows } = await client.sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'Guideline'
      );
    `;
    
    const tableExists = rows[0].exists;
    
    if (!tableExists) {
      // 创建表
      await client.sql`
        CREATE TYPE "Status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
        
        CREATE TABLE "Guideline" (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category JSONB NOT NULL,
          language TEXT NOT NULL DEFAULT 'general',
          content TEXT NOT NULL,
          version TEXT,
          "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          popularity INTEGER DEFAULT 0,
          status "Status" DEFAULT 'DRAFT',
          "createdBy" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      return NextResponse.json({ message: '数据表已成功创建' });
    }
    
    return NextResponse.json({ message: '数据表已存在' });
  } catch (error) {
    console.error('设置数据库失败:', error);
    return NextResponse.json(
      { error: '设置数据库失败' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
