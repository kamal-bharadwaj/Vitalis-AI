import { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Chat',
}

export default function PatientChatPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Chat</h1>
          <p className="text-muted-foreground mt-1">Ask questions about your medical reports</p>
        </div>
        <button
          id="new-chat-btn"
          disabled
          className="flex items-center gap-2 bg-primary text-primary-foreground opacity-60 cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-semibold shrink-0"
          title="Coming in Phase 4"
        >
          <Plus className="size-4" />
          New Chat
        </button>
      </div>

      <div className="bg-card border border-dashed border-border rounded-xl py-16 flex flex-col items-center gap-4 text-center">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">AI Chat — Coming in Phase 4</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Once your reports are uploaded and processed, you&apos;ll be able to ask MedicBot
            questions like &ldquo;What was my blood sugar level?&rdquo; or &ldquo;Summarise my diagnosis.&rdquo;
          </p>
        </div>
        <Link
          href="/patient/reports/upload"
          className="inline-flex items-center gap-2 border border-border hover:bg-muted transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold text-foreground"
        >
          Upload a Report First
        </Link>
      </div>
    </div>
  )
}
