import { NextResponse } from 'next/server';
import { pool } from '../_utils/db';

export async function GET() {
  try {
    // 检查表是否已存在
    const result = await pool.sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'Guideline'
      );
    `;
    
    const tableExists = result.rows[0].exists;
    
    if (!tableExists) {
      // 创建表
      await pool.sql`
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
  }
}
