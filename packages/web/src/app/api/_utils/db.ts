import { neon } from "@neondatabase/serverless"

// Create a SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID()
}

// Conversation helpers
export async function createConversation(title?: string) {
  const id = generateId()
  await sql`
    INSERT INTO "Conversations" (id, title)
    VALUES (${id}, ${title || "New Conversation"})
  `
  return id
}

export async function getConversation(id: string) {
  const conversation = await sql`
    SELECT * FROM "Conversations" WHERE id = ${id}
  `
  return conversation[0] || null
}

export async function getConversations() {
  return sql`
    SELECT * FROM "Conversations" 
    ORDER BY "createdAt" DESC
  `
}

// Message helpers
export async function createMessage(conversationId: string, role: string, content: string) {
  const id = generateId()
  await sql`
    INSERT INTO "Messages" (id, "conversationId", role, content)
    VALUES (${id}, ${conversationId}, ${role}, ${content})
  `
  return id
}

export async function getMessages(conversationId: string) {
  return sql`
    SELECT * FROM "Messages" 
    WHERE "conversationId" = ${conversationId}
    ORDER BY "createdAt" ASC
  `
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
  await sql`
    INSERT INTO "GeneratedCode" (id, "conversationId", "messageId", code, language, title, description)
    VALUES (${id}, ${conversationId}, ${messageId}, ${code}, ${language}, ${title}, ${description})
  `
  return id
}

export async function getGeneratedCode(conversationId: string) {
  return sql`
    SELECT * FROM "GeneratedCode" 
    WHERE "conversationId" = ${conversationId}
    ORDER BY "createdAt" DESC
  `
}
