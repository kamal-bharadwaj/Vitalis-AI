'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Trash2, Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { createAndNavigateToSession, deleteChatSession } from '@/app/actions/chat'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/app/actions/chat'
import { format, isToday, isYesterday } from 'date-fns'

interface ChatSessionsListProps {
  sessions: ChatSession[]
}

function formatSessionDate(dateStr: string) {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export default function ChatSessionsList({ sessions }: ChatSessionsListProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleNew = () => {
    startTransition(() => {
      createAndNavigateToSession()
    })
  }

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this chat session?')) return
    setDeletingId(sessionId)
    startTransition(() => {
      deleteChatSession(sessionId).finally(() => setDeletingId(null))
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
          <p className="text-xs text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          id="new-chat-btn"
          onClick={handleNew}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors px-3 py-1.5 rounded-lg"
        >
          <Plus className="size-3" />
          New
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center py-10 px-4">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <button
              onClick={handleNew}
              className="text-xs text-primary hover:underline font-medium"
            >
              Start your first chat →
            </button>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = pathname === `/patient/chat/${session.id}`
            return (
              <Link
                key={session.id}
                href={`/patient/chat/${session.id}`}
                className={cn(
                  'group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[13px] font-medium">{session.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-muted-foreground group-hover:hidden">
                    {formatSessionDate(session.updated_at)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    disabled={deletingId === session.id}
                    title="Delete session"
                    className="hidden group-hover:flex size-6 rounded-md hover:bg-destructive/10 hover:text-destructive items-center justify-center text-muted-foreground transition-colors"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
