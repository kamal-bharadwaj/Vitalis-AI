import { Metadata } from 'next'
import { getChatSessions } from '@/app/actions/chat'
import ChatSessionsList from '@/components/patient/chat-sessions-list'
import { Bot, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Chat — Vitalis',
  description: 'Ask MedicBot questions about your medical reports using AI.',
}

export default async function PatientChatPage() {
  const sessions = await getChatSessions()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: session list */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background h-full">
        <ChatSessionsList sessions={sessions} />
      </aside>

      {/* Main: welcome / empty state */}
      <main className="flex-1 flex items-center justify-center bg-muted/30 p-8">
        <div className="max-w-md text-center space-y-5">
          <div className="mx-auto size-20 rounded-full bg-gradient-to-br from-sidebar-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Bot className="size-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Ask Vitalis
            </h1>
            <p className="text-muted-foreground mt-2">
              Start a new conversation or select an existing one to ask questions
              about your medical reports.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 text-left text-sm">
            {[
              '🩸 "What was my blood sugar level?"',
              '💊 "Which medications were prescribed?"',
              '📋 "Summarise my latest diagnosis"',
              '❓ "What does my LDL result mean?"',
            ].map((q) => (
              <div
                key={q}
                className="bg-card border border-border rounded-lg px-4 py-2.5 text-foreground/80"
              >
                {q}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Answers are sourced only from your uploaded reports — not general knowledge.
          </p>
        </div>
      </main>
    </div>
  )
}
