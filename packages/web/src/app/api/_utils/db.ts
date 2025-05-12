import { createClient } from '@vercel/postgres'

export function generateId(): string {
  return crypto.randomUUID()
}

// Conversation helpers
export async function createConversation(title?: string) {
  const client = createClient()
  const id = generateId()
  try {
    await client.connect()
    await client.sql`
      INSERT INTO "Conversations" (id, title)
      VALUES (${id}, ${title || "New Conversation"})
    `
    return id
  } finally {
    await client.end()
  }
}

export async function getConversation(id: string) {
  const client = createClient()
  try {
    await client.connect()
    const { rows } = await client.sql`
      SELECT * FROM "Conversations" WHERE id = ${id}
    `
    return rows[0] || null
  } finally {
    await client.end()
  }
}

export async function getConversations() {
  const client = createClient()
  try {
    await client.connect()
    const { rows } = await client.sql`
      SELECT * FROM "Conversations" 
      ORDER BY "createdAt" DESC
    `
    return rows
  } finally {
    await client.end()
  }
}

// Message helpers
export async function createMessage(conversationId: string, role: string, content: string) {
  const client = createClient()
  const id = generateId()
  try {
    await client.connect()
    await client.sql`
      INSERT INTO "Messages" (id, "conversationId", role, content)
      VALUES (${id}, ${conversationId}, ${role}, ${content})
    `
    return id
  } finally {
    await client.end()
  }
}

export async function getMessages(conversationId: string) {
  const client = createClient()
  try {
    await client.connect()
    const { rows } = await client.sql`
      SELECT * FROM "Messages" 
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" ASC
    `
    return rows
  } finally {
    await client.end()
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
  const client = createClient()
  const id = generateId()
  try {
    await client.connect()
    await client.sql`
      INSERT INTO "GeneratedCode" (id, "conversationId", "messageId", code, language, title, description)
      VALUES (${id}, ${conversationId}, ${messageId}, ${code}, ${language}, ${title}, ${description})
    `
    return id
  } finally {
    await client.end()
  }
}

export async function getGeneratedCode(conversationId: string) {
  const client = createClient()
  try {
    await client.connect()
    const { rows } = await client.sql`
      SELECT * FROM "GeneratedCode" 
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" DESC
    `
    return rows
  } finally {
    await client.end()
  }
}
