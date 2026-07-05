import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// 🔒 No-cache — sensitive admin data must never be cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', id)
    .eq('role', 'patient')
    .single()

  return {
    title: data?.full_name ? `Patient: ${data.full_name}` : 'Patient Detail',
  }
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400' },
  processing: { label: 'Processing', icon: Loader2, className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', icon: XCircle, className: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
}

export default async function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch patient profile (admin can see all via RLS + service role, but we check role too)
  const { data: patient, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'patient')
    .single()

  if (error || !patient) {
    notFound()
  }

  // Fetch patient's documents
  const { data: documents } = await supabase
    .from('documents')
    .select('id, file_name, file_type, file_size, status, uploaded_at, processed_at')
    .eq('patient_id', id)
    .order('uploaded_at', { ascending: false })

  // Fetch session count
  const { count: sessionCount } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', id)

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/admin/patients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Patients
      </Link>

      {/* Patient Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="size-16 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-2xl font-bold text-muted-foreground">
            {patient.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{patient.full_name}</h1>
            <p className="text-muted-foreground mt-0.5">{patient.email}</p>
            <div className="flex flex-wrap gap-4 mt-4">
              {patient.phone && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-4" />
                  {patient.phone}
                </div>
              )}
              {patient.gender && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground capitalize">
                  <User className="size-4" />
                  {patient.gender}
                </div>
              )}
              {patient.date_of_birth && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  {format(new Date(patient.date_of_birth), 'MMMM d, yyyy')}
                </div>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground shrink-0">
            <p>Member since</p>
            <p className="font-medium text-foreground">
              {format(new Date(patient.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <FileText className="size-4" />
            Documents
          </div>
          <p className="text-2xl font-bold text-foreground">{documents?.length ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MessageSquare className="size-4" />
            Chat Sessions
          </div>
          <p className="text-2xl font-bold text-foreground">{sessionCount ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-1 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="size-4" />
            Last Updated
          </div>
          <p className="text-sm font-medium text-foreground">
            {format(new Date(patient.updated_at), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Medical Documents ({documents?.length ?? 0})
        </h2>

        {!documents?.length ? (
          <div className="bg-card border border-border rounded-xl py-12 flex flex-col items-center gap-3 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No documents uploaded</p>
            <p className="text-sm text-muted-foreground">
              This patient hasn&apos;t uploaded any medical reports yet.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">File</th>
                    <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden sm:table-cell">
                      Type
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden md:table-cell">
                      Size
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden md:table-cell">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, idx) => {
                    const status = statusConfig[doc.status as keyof typeof statusConfig] ?? statusConfig.pending
                    const StatusIcon = status.icon

                    return (
                      <tr
                        key={doc.id}
                        className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${
                          idx % 2 === 0 ? '' : 'bg-muted/10'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <FileText className="size-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[200px]">
                              {doc.file_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="uppercase text-xs font-medium text-muted-foreground">
                            {doc.file_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                          {formatBytes(doc.file_size)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}
                          >
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
    </div>
  )
}
