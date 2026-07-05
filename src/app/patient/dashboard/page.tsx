import { Metadata } from 'next'
import Link from 'next/link'
import { requirePatient } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'
import { FileText, MessageSquare, Upload, ChevronRight, Clock } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'My Dashboard',
}

async function getPatientOverview(patientId: string) {
  const supabase = await createClient()

  const [
    { count: totalDocs },
    { count: completedDocs },
    { count: totalChats },
    { data: recentDocs },
  ] = await Promise.all([
    supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId),
    supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'completed'),
    supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId),
    supabase
      .from('documents')
      .select('id, file_name, status, uploaded_at')
      .eq('patient_id', patientId)
      .order('uploaded_at', { ascending: false })
      .limit(3),
  ])

  return {
    totalDocs: totalDocs ?? 0,
    completedDocs: completedDocs ?? 0,
    totalChats: totalChats ?? 0,
    recentDocs: recentDocs ?? [],
  }
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  processing: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  failed: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
}

export default async function PatientDashboardPage() {
  const user = await requirePatient()
  const overview = await getPatientOverview(user.id)

  const firstName = (user.user_metadata?.full_name as string)?.split(' ')[0] || 'there'

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Hello, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {overview.totalDocs === 0
            ? 'Upload your first medical report to get started.'
            : `You have ${overview.totalDocs} report${overview.totalDocs !== 1 ? 's' : ''} uploaded.`}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <FileText className="size-4" />
            Reports
          </div>
          <p className="text-2xl font-bold text-foreground">{overview.totalDocs}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {overview.completedDocs} processed
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MessageSquare className="size-4" />
            Chats
          </div>
          <p className="text-2xl font-bold text-foreground">{overview.totalChats}</p>
          <p className="text-xs text-muted-foreground mt-1">sessions started</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Clock className="size-4" />
            Ready to chat
          </div>
          <p className="text-2xl font-bold text-foreground">{overview.completedDocs}</p>
          <p className="text-xs text-muted-foreground mt-1">reports analysable</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/patient/reports/upload"
          id="quick-upload"
          className="flex items-center gap-4 bg-card border border-border hover:border-primary/50 rounded-xl p-5 transition-all hover:shadow-sm group"
        >
          <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Upload className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Upload Report</p>
            <p className="text-sm text-muted-foreground">Add a new medical document</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>

        <Link
          href="/patient/chat"
          id="quick-chat"
          className="flex items-center gap-4 bg-card border border-border hover:border-primary/50 rounded-xl p-5 transition-all hover:shadow-sm group"
        >
          <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Ask MedicBot</p>
            <p className="text-sm text-muted-foreground">Chat about your reports</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      </div>

      {/* Recent Reports */}
      {overview.recentDocs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Reports</h2>
            <Link
              href="/patient/reports"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {overview.recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ml-3 ${
                    statusColors[doc.status] ?? statusColors.pending
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {overview.totalDocs === 0 && (
        <div className="bg-card border border-dashed border-border rounded-xl py-16 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <FileText className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">No reports yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Upload your first medical report to start asking MedicBot questions about your health.
            </p>
          </div>
          <Link
            href="/patient/reports/upload"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold"
          >
            <Upload className="size-4" />
            Upload First Report
          </Link>
        </div>
      )}
    </div>
  )
}
