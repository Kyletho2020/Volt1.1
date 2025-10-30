import { supabaseAdmin } from './supabaseClient.js'
import { runChatCompletion } from './llmService.js'

async function createSession(metadata = {}, title) {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .insert({ metadata, title: title ?? null })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`)
  }

  return data
}

async function touchSession(sessionId) {
  const { error } = await supabaseAdmin
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to update chat session timestamp: ${error.message}`)
  }
}

async function insertMessage(sessionId, role, content) {
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content })

  if (error) {
    throw new Error(`Failed to insert chat message: ${error.message}`)
  }
}

async function fetchConversation(sessionId, limit = 15) {
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to read chat history: ${error.message}`)
  }

  return data ?? []
}

export async function listSessions(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list chat sessions: ${error.message}`)
  }

  return data ?? []
}

export async function getSessionMessages(sessionId) {
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to retrieve session messages: ${error.message}`)
  }

  return data ?? []
}

export async function handleChatRequest(payload) {
  if (!payload?.message || payload.message.trim().length === 0) {
    throw new Error('Message content is required')
  }

  let sessionId = payload.sessionId
  if (!sessionId) {
    const session = await createSession(payload.metadata, payload.title)
    sessionId = session.id
  }

  await insertMessage(sessionId, 'user', payload.message.trim())

  const history = await fetchConversation(sessionId)
  const { content: reply, usage } = await runChatCompletion(history)

  await insertMessage(sessionId, 'assistant', reply)
  await touchSession(sessionId)

  return { sessionId, reply, usage }
}
