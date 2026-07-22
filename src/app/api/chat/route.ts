import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embedder'
import { retrieveRelevantChunks } from '@/lib/rag/retriever'
import { buildPrompt } from '@/lib/rag/generator'
import { logAction } from '@/lib/audit-logger'
import { google } from '@ai-sdk/google'
import { streamText, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { messages, sessionId } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      sessionId: string
    }

    if (!messages?.length || !sessionId) {
      return NextResponse.json({ error: 'Missing messages or sessionId' }, { status: 400 })
    }

    // Get the latest user message
    const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (!latestUserMsg) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 })
    }

    // RAG: embed the user question and retrieve relevant chunks (catch embedding/retrieval errors gracefully)
    let chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>> = []
    try {
      const embedding = await embedText(latestUserMsg.content)
      chunks = await retrieveRelevantChunks(embedding, user.id, 6, 0.35)
    } catch (ragErr) {
      console.warn('RAG retrieval notice:', ragErr)
      // Continue without chunks if vector search has an issue
    }

    // Build history (all messages except the latest user message)
    const chatHistory = messages.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const prompt = buildPrompt(chunks, latestUserMsg.content)

    const MEDICAL_SYSTEM_PROMPT = `You are Vitalis, a helpful and compassionate AI medical assistant. Your primary job is to help patients understand their uploaded medical reports, lab results, and general health questions.

GUIDELINES:
1. GREETINGS & INTRODUCTIONS: If the user says hello, asks "who are you?", or asks basic general questions, respond warmly and introduce yourself as Vitalis, their AI health and report assistant.
2. REPORT CONTEXT: When answering questions about specific lab results, test metrics, or uploaded documents, use the provided report context. Always reference the report name/section when available.
3. GENERAL HEALTH EDUCATION: If a user asks general health questions (e.g., diet recommendations, general symptom explanations), provide helpful, clear, patient-friendly guidance based on established medical knowledge, while reminding them to consult their primary healthcare provider.
4. UNKNOWN REPORT DATA: If the user asks about specific test values not present in their context, let them know clearly that those specific values were not found in their current uploaded reports.
5. SAFETY: Never issue formal medical diagnoses or prescribe specific medical dosages. Encourage patients to verify test results with their physician.`

    // Use Gemini 3.5 Flash Standard model
    let result
    try {
      result = streamText({
        model: google('gemini-3.5-flash'),
        system: MEDICAL_SYSTEM_PROMPT,
        messages: [
          ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: prompt },
        ],
      })
    } catch (modelErr) {
      console.warn('Primary model gemini-3.5-flash failed, falling back to gemini-3.1-flash-lite:', modelErr)
      result = streamText({
        model: google('gemini-3.1-flash-lite'),
        system: MEDICAL_SYSTEM_PROMPT,
        messages: [
          ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: prompt },
        ],
      })
    }

    // Persist the user message to Supabase
    const userMsgContent = latestUserMsg.content
    const sourcesPayload = chunks.map((c) => ({
      id: c.id,
      fileName: (c.metadata?.file_name as string) ?? 'Report',
      page: c.metadata?.pageNumber ? Number(c.metadata.pageNumber) : null,
      similarity: c.similarity,
      snippet: c.content.slice(0, 200),
    }))

    supabase.from('chat_messages').insert({
      session_id: sessionId,
      patient_id: user.id,
      role: 'user',
      content: userMsgContent,
      sources: [],
    }).then(() => {})

    // Log the chat query
    logAction({
      userId: user.id,
      action: 'chat_query',
      targetTable: 'chat_sessions',
      targetId: sessionId,
      details: { questionLength: latestUserMsg.content.length, chunksRetrieved: chunks.length },
    })

    // Stream the response
    const uiStream = toUIMessageStream({ stream: result.fullStream })

    // After the stream completes, save the AI response
    void Promise.resolve(result.text).then(async (fullText) => {
      if (fullText && fullText.trim()) {
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          patient_id: user.id,
          role: 'assistant',
          content: fullText,
          sources: sourcesPayload,
        })

        // Auto-title the session from the first message
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)

        if ((count ?? 0) <= 2) {
          const title = userMsgContent.length > 60
            ? userMsgContent.slice(0, 57) + '...'
            : userMsgContent
          await supabase.from('chat_sessions').update({ title }).eq('id', sessionId)
        }
      }
    }).catch((err: unknown) => {
      Sentry.captureException(err)
      console.error('Failed to persist AI response:', err)
    })

    return createUIMessageStreamResponse({ stream: uiStream })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[/api/chat] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
