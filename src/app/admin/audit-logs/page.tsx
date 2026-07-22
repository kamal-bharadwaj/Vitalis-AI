import { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'
import AuditLogsTable from '@/components/admin/audit-logs-table'
import { logAction } from '@/lib/audit-logger'
import { Shield, Activity, AlertTriangle, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Audit Logs — Admin',
  description: 'Review all system activity and user actions.',
}

interface AuditLogRow {
  id: string
  user_id: string | null
  action: string
  target_table: string | null
  target_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
}

async function getAuditLogs() {
  const supabase = await createClient()

  // Fetch logs (newest first, last 500)
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw error

  // Fetch user profiles to display email
  const userIds = [...new Set((logs ?? []).map((l: AuditLogRow) => l.user_id).filter(Boolean))]
  let profilesMap: Record<string, { email: string | null; full_name: string | null }> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds as string[])

    profilesMap = Object.fromEntries(
      (profiles ?? []).map((p: ProfileRow) => [
        p.id,
        { email: p.email, full_name: p.full_name },
      ])
    )
  }

  return (logs ?? []).map((log: AuditLogRow) => ({
    ...log,
    user_email: log.user_id ? profilesMap[log.user_id]?.email ?? null : null,
    user_name: log.user_id ? profilesMap[log.user_id]?.full_name ?? null : null,
  }))
}

export default async function AdminAuditLogsPage() {
  const admin = await requireAdmin()
  const logs = await getAuditLogs()

  // Log this admin view
  logAction({
    userId: admin.id,
    action: 'admin_view_logs',
    targetTable: 'audit_logs',
    details: { logsViewed: logs.length },
  })

  // Stats
  const loginFailed = logs.filter((l) => l.action === 'login_failed').length
  const uniqueUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size
  const totalActions = logs.length

  // eslint-disable-next-line react-hooks/purity
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const last24h = logs.filter(
    (l) => new Date(l.created_at) > cutoff
  ).length

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="size-7 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete trail of all system and user activity.
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-mono">
          Last 500 events
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Activity className="size-4" />
            Total Events
          </div>
          <p className="text-2xl font-bold text-foreground">{totalActions}</p>
          <p className="text-xs text-muted-foreground mt-1">last 500 logged</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Activity className="size-4 text-blue-500" />
            Last 24h
          </div>
          <p className="text-2xl font-bold text-foreground">{last24h}</p>
          <p className="text-xs text-muted-foreground mt-1">recent activity</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Users className="size-4" />
            Unique Users
          </div>
          <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
          <p className="text-xs text-muted-foreground mt-1">in this window</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm mb-2 text-red-500">
            <AlertTriangle className="size-4" />
            Failed Logins
          </div>
          <p className="text-2xl font-bold text-foreground">{loginFailed}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {loginFailed > 5 ? '⚠️ Suspicious activity' : 'looks normal'}
          </p>
        </div>
      </div>

      {/* Logs table */}
      <AuditLogsTable logs={logs} />
    </div>
  )
}
