'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePatient } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAction } from '@/lib/audit-logger'

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  sources: {
    id: string
    fileName: string
    page: number | null
    similarity: number
    snippet: string
  }[]
  created_at: string
}

// ── Create a new session ──────────────────────────────────────────────────────
export async function createChatSession(): Promise<{ sessionId: string } | { error: string }> {
  const user = await requirePatient()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ patient_id: user.id, title: 'New Conversation' })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create session' }
  }

  revalidatePath('/patient/chat')
  return { sessionId: data.id }
}

// ── List all sessions for the current patient ─────────────────────────────────
export async function getChatSessions(): Promise<ChatSession[]> {
  const user = await requirePatient()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at, updated_at')
    .eq('patient_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(30)

  if (error) throw error
  return (data ?? []) as ChatSession[]
}

// ── Get messages for a session ────────────────────────────────────────────────
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const user = await requirePatient()
  const supabase = await createClient()

  // Verify ownership
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('patient_id', user.id)
    .single()

  if (!session) throw new Error('Session not found')

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, session_id, role, content, sources, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ChatMessage[]
}

// ── Delete a session ──────────────────────────────────────────────────────────
export async function deleteChatSession(sessionId: string): Promise<void> {
  const user = await requirePatient()
  const supabase = await createClient()

  await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('patient_id', user.id)

  logAction({
    userId: user.id,
    action: 'chat_query',
    targetTable: 'chat_sessions',
    targetId: sessionId,
    details: { action: 'delete_session' },
  })

  revalidatePath('/patient/chat')
  redirect('/patient/chat')
}

// ── Create session and redirect ───────────────────────────────────────────────
export async function createAndNavigateToSession(): Promise<void> {
  const result = await createChatSession()
  if ('error' in result) throw new Error(result.error)
  redirect(`/patient/chat/${result.sessionId}`)
}
