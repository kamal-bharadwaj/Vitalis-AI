'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, Bot, User, FileText, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ChatMessage } from '@/app/actions/chat'

interface Source {
  id: string
  fileName: string
  page: number | null
  similarity: number
  snippet: string
}

interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  isStreaming?: boolean
  error?: boolean
}

interface ChatInterfaceProps {
  sessionId: string
  initialMessages: ChatMessage[]
}

// ── Source Card ───────────────────────────────────────────────────────────────
function SourceCard({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round(source.similarity * 100)

  return (
    <div className="border border-border rounded-lg overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-3 shrink-0 text-primary" />
          <span className="font-medium text-foreground truncate">{source.fileName}</span>
          {source.page && (
            <span className="text-muted-foreground shrink-0">· p.{source.page}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground">{pct}% match</span>
          {expanded ? (
            <ChevronUp className="size-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 py-2 text-muted-foreground bg-background border-t border-border">
          <p className="leading-relaxed">{source.snippet}</p>
        </div>
      )}
    </div>
  )
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: LocalMessage }) {
  const isUser = msg.role === 'user'

  // Don't render an empty streaming bubble if no content has arrived yet (loading indicator handles it)
  if (!isUser && msg.isStreaming && !msg.content && !msg.error) {
    return null
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-sidebar-primary text-sidebar-primary-foreground'
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : msg.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
              : 'bg-card border border-border text-card-foreground rounded-tl-sm shadow-sm'
          }`}
        >
          {msg.error ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{msg.content || 'Something went wrong. Please try again.'}</span>
            </div>
          ) : (
            <>
              {msg.content}
              {msg.isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
              )}
            </>
          )}
        </div>

        {/* Sources attribution */}
        {!isUser && msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
          <div className="w-full space-y-1.5 mt-1">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
              Sources used
            </p>
            <div className="space-y-1">
              {msg.sources.map((src) => (
                <SourceCard key={src.id} source={src} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Chat Interface ────────────────────────────────────────────────────────
export default function ChatInterface({ sessionId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<LocalMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: m.sources ?? [],
    }))
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    // Append user message + empty assistant placeholder
    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()

    const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setIsLoading(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: [...historyForApi, { role: 'user', content: text }],
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`
        try {
          const errJson = await res.json()
          if (errJson?.error) errMessage = errJson.error
        } catch {
          // ignore
        }
        throw new Error(errMessage)
      }

      if (!res.body) {
        throw new Error('No response stream received')
      }

      // Read SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:') || trimmed === 'data: [DONE]') continue
          const raw = trimmed.slice(5).trim()
          if (!raw) continue

          try {
            const chunk = JSON.parse(raw) as {
              type: string
              delta?: string
              textDelta?: string
              text?: string
              content?: string
            }

            // Extract delta from AI SDK v7 chunk format
            const textPart = chunk.delta ?? chunk.textDelta ?? chunk.text ?? chunk.content
            if (textPart) {
              fullText += textPart
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: fullText, isStreaming: true }
                    : m
                )
              )
            }
          } catch {
            // Ignore unparseable chunks
          }
        }
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: fullText || 'No response generated.',
                isStreaming: false,
              }
            : m
        )
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          )
        )
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed. Please try again.'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: errorMessage,
                  isStreaming: false,
                  error: true,
                }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, sessionId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="size-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">Ask Vitalis anything</p>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Ask about your medical reports, diet recommendations, or health questions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-lg">
              {[
                'What to eat when we got chronic kidney disease?',
                'Who are you?',
                'What was my blood sugar level?',
                'Summarise my diagnosis',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setInput(q)
                    textareaRef.current?.focus()
                  }}
                  className="text-xs px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Loading indicator when waiting for first token */}
        {isLoading && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div className="size-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shrink-0">
              <Bot className="size-4" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5 shadow-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Vitalis is thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background px-4 md:px-6 py-4">
        <div className="flex items-end gap-3 bg-card border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors shadow-sm">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your medical reports or health questions…"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-h-[24px] max-h-40 disabled:opacity-60"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={handleStop}
              id="stop-btn"
              className="size-8 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center shrink-0"
              title="Stop generation"
            >
              <div className="size-3 rounded-sm bg-destructive" />
            </button>
          ) : (
            <button
              type="button"
              onClick={sendMessage}
              id="send-btn"
              disabled={!input.trim()}
              className="size-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 shadow-sm"
              title="Send message (Enter)"
            >
              <Send className="size-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Answers provide health information based on medical context. Always consult a healthcare professional for personalized medical advice.
        </p>
      </div>
    </div>
  )
}
