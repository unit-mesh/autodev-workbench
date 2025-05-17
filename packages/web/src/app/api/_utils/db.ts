import { createPool } from '@vercel/postgres'

// 定义模拟连接池的接口
/* eslint-disable @typescript-eslint/no-explicit-any */
interface MockPool {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[], rowCount: number }>;
  sql: (strings: TemplateStringsArray, ...values: any[]) => Promise<{ rows: any[], rowCount: number }>;
  connect: () => Promise<{
    query: (sql: string) => Promise<any>;
    release: () => void;
  }>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// 使用类型来明确指定pool变量类型
let pool: ReturnType<typeof createPool> | MockPool;

// 创建一个数据库连接池，如果环境变量不存在则创建一个模拟连接
try {
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    pool = createPool();
  } else {
    // 在构建时如果没有环境变量，创建一个模拟对象
    console.warn('警告: 数据库连接环境变量未找到，使用模拟连接。这在构建时是正常的。');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    pool = {
      query: () => Promise.resolve({ rows: [], rowCount: 0 }),
      sql: () => Promise.resolve({ rows: [], rowCount: 0 }),
      connect: () => Promise.resolve({
        query: () => Promise.resolve({}),
        release: () => {},
      }),
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
} catch (error) {
  console.error('创建数据库连接池失败:', error);
  // 创建模拟连接以避免构建失败
  /* eslint-disable @typescript-eslint/no-explicit-any */
  pool = {
    query: () => Promise.resolve({ rows: [], rowCount: 0 }),
    sql: () => Promise.resolve({ rows: [], rowCount: 0 }),
    connect: () => Promise.resolve({
      query: () => Promise.resolve({}),
      release: () => {},
    }),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export { pool }

export function generateId(): string {
  return crypto.randomUUID()
}

// Conversation helpers
export async function createConversation(title?: string) {
  const id = generateId()
  try {
    await pool.sql`
      INSERT INTO "Conversations" (id, title)
      VALUES (${id}, ${title || "New Conversation"})
    `
    return id
  } catch (error) {
    console.error('创建对话失败:', error)
    throw error
  }
}

export async function getConversation(id: string) {
  try {
    const result = await pool.sql`
      SELECT * FROM "Conversations" WHERE id = ${id}
    `
    return result.rows[0] || null
  } catch (error) {
    console.error('获取对话失败:', error)
    throw error
  }
}

export async function getConversations() {
  try {
    const result = await pool.sql`
      SELECT * FROM "Conversations" 
      ORDER BY "createdAt" DESC
    `
    return result.rows
  } catch (error) {
    console.error('获取对话列表失败:', error)
    throw error
  }
}

// Message helpers
export async function createMessage(conversationId: string, role: string, content: string) {
  const id = generateId()
  try {
    await pool.sql`
      INSERT INTO "Messages" (id, "conversationId", role, content)
      VALUES (${id}, ${conversationId}, ${role}, ${content})
    `
    return id
  } catch (error) {
    console.error('创建消息失败:', error)
    throw error
  }
}

export async function getMessages(conversationId: string) {
  try {
    const result = await pool.sql`
      SELECT * FROM "Messages" 
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" ASC
    `
    return result.rows
  } catch (error) {
    console.error('获取消息列表失败:', error)
    throw error
  }
}

export async function saveMessage(
  conversationId: string,
  prompt: string,
  text: string
) {
  const messageId = await createMessage(conversationId, "assistant", text)

  const codeBlockRegex = /```([a-zA-Z0-9]+)?\n([\s\S]*?)```/g
  let match
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || "jsx"
    const code = match[2].trim()
    await saveGeneratedCode(
      conversationId,
      messageId,
      code,
      language,
      `Generated ${language} code`,
      `Code generated from prompt: ${prompt.substring(0, 100)}...`
    )
  }
}

// Generated code helpers
export async function saveGeneratedCode(
  conversationId: string,
  messageId: string,
  code: string,
  language: string,
  title?: string,
  description?: string,
) {
  const id = generateId()
  try {
    await pool.sql`
      INSERT INTO "GeneratedCode" (id, "conversationId", "messageId", code, language, title, description)
      VALUES (${id}, ${conversationId}, ${messageId}, ${code}, ${language}, ${title}, ${description})
    `
    return id
  } catch (error) {
    console.error('保存生成代码失败:', error)
    throw error
  }
}

export async function getGeneratedCode(conversationId: string) {
  try {
    const result = await pool.sql`
      SELECT * FROM "GeneratedCode" 
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" DESC
    `
    return result.rows
  } catch (error) {
    console.error('获取生成代码失败:', error)
    throw error
  }
}

// 执行SQL查询并返回结果
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function query(sql: string, params: any[] = []) {
  try {
    const result = await pool.query(sql, params)
    return result.rows
  } catch (error) {
    console.error('数据库查询错误:', error)
    throw error
  }
}

// 执行SQL模板字符串查询
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  try {
    const result = await pool.sql(strings, ...values)
    return result.rows
  } catch (error) {
    console.error('数据库SQL模板查询错误:', error)
    throw error
  }
}

// 执行事务
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('事务执行错误:', error)
    throw error
  } finally {
    client.release()
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
