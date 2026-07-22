import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getChatSessions, getSessionMessages } from '@/app/actions/chat'
import ChatInterface from '@/components/patient/chat-interface'
import ChatSessionsList from '@/components/patient/chat-sessions-list'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params
  const sessions = await getChatSessions()
  const session = sessions.find((s) => s.id === sessionId)
  return {
    title: session ? `${session.title} — Vitalis Chat` : 'Chat — Vitalis',
  }
}

export default async function ChatSessionPage({ params }: Props) {
  const { sessionId } = await params

  const [sessions, messages] = await Promise.all([
    getChatSessions(),
    getSessionMessages(sessionId).catch(() => null),
  ])

  if (messages === null) notFound()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: session list */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background h-full">
        <ChatSessionsList sessions={sessions} />
      </aside>

      {/* Main: active chat */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Session header */}
        <div className="px-4 md:px-6 py-3.5 border-b border-border bg-background flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {sessions.find((s) => s.id === sessionId)?.title ?? 'Conversation'}
            </p>
            <p className="text-xs text-muted-foreground">
              {messages.length > 0
                ? `${messages.length} message${messages.length !== 1 ? 's' : ''}`
                : 'No messages yet — ask your first question below'}
            </p>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface sessionId={sessionId} initialMessages={messages} />
        </div>
      </main>
    </div>
  )
}
