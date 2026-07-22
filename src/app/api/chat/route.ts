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

    // RAG: embed the user question and retrieve relevant chunks
    const [embedding] = await Promise.all([embedText(latestUserMsg.content)])
    const chunks = await retrieveRelevantChunks(embedding, user.id, 6, 0.45)

    // Build history (all messages except the latest user message)
    const chatHistory = messages.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const prompt = buildPrompt(chunks, latestUserMsg.content)

    const MEDICAL_SYSTEM_PROMPT = `You are Vitalis, a helpful medical report assistant. Answer patient questions STRICTLY based on the medical report data provided in the context below.

RULES:
1. Only answer using information from the provided context.
2. If the context does not contain the answer, say "I could not find this information in your uploaded reports. Please ensure the relevant report has been uploaded and processed."
3. Never make up medical information or provide diagnoses.
4. Always mention which report or section your answer comes from when referencing data.
5. Use clear, patient-friendly language. Explain medical terms when used.
6. If a value is abnormal, mention the normal range for reference.
7. Be concise but thorough.`

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: MEDICAL_SYSTEM_PROMPT,
      messages: [
        ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: prompt },
      ],
    })

    // Persist the user message to Supabase (fire and forget)
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
