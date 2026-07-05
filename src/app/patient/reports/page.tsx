import { Metadata } from 'next'
import { requirePatient } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, Upload, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'My Reports',
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400' },
  processing: { label: 'Processing', icon: Loader2, className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', icon: XCircle, className: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function PatientReportsPage() {
  const user = await requirePatient()
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('documents')
    .select('id, file_name, file_type, file_size, status, uploaded_at, processed_at')
    .eq('patient_id', user.id)
    .order('uploaded_at', { ascending: false })

  const docs = documents ?? []

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Reports</h1>
          <p className="text-muted-foreground mt-1">
            {docs.length} document{docs.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <Link
          href="/patient/reports/upload"
          id="upload-report-btn"
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2.5 rounded-lg text-sm font-semibold shrink-0"
        >
          <Upload className="size-4" />
          Upload
        </Link>
      </div>

      {/* Empty State */}
      {docs.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl py-16 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <FileText className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">No reports yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Upload your first medical report to start getting AI-powered insights.
            </p>
          </div>
          <Link
            href="/patient/reports/upload"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold"
          >
            <Upload className="size-4" />
            Upload Report
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">File</th>
                  <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden md:table-cell">Size</th>
                  <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden md:table-cell">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, idx) => {
                  const status = statusConfig[doc.status] ?? statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <tr
                      key={doc.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FileText className="size-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[180px] md:max-w-[300px]">
                            {doc.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="uppercase text-xs font-medium text-muted-foreground">{doc.file_type}</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                        {formatBytes(doc.file_size)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                          <StatusIcon className="size-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                        {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
