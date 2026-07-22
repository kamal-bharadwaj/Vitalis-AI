'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Shield,
  LogIn,
  LogOut,
  Upload,
  Trash2,
  MessageSquare,
  Eye,
  Download,
  UserX,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  target_table: string | null
  target_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
  // joined
  user_email?: string | null
  user_name?: string | null
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  login_failed: LogIn,
  logout: LogOut,
  upload_document: Upload,
  delete_document: Trash2,
  view_document: Eye,
  chat_query: MessageSquare,
  export_data: Download,
  delete_account: UserX,
  recover_account: UserCheck,
  admin_view_patient: Eye,
  admin_view_logs: Shield,
}

const ACTION_COLORS: Record<string, string> = {
  login: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  login_failed: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  logout: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
  upload_document: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  delete_document: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  view_document: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  chat_query: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
  export_data: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  delete_account: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  recover_account: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  admin_view_patient: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  admin_view_logs: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
}

interface AuditLogsTableProps {
  logs: AuditLog[]
}

export default function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).sort()

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.action.includes(search.toLowerCase()) ||
      (log.user_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (log.ip_address ?? '').includes(search)
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, action, IP…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="size-4" />
        Showing {filtered.length} of {logs.length} log{logs.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[1fr_1.5fr_120px_100px_40px] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>User</span>
          <span>Action / Details</span>
          <span>IP Address</span>
          <span>Time</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No logs match your filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((log) => {
              const Icon = ACTION_ICONS[log.action] ?? Shield
              const colorClass = ACTION_COLORS[log.action] ?? 'text-muted-foreground bg-muted'
              const isExpanded = expandedId === log.id
              const hasDetails = Object.keys(log.details || {}).length > 0

              return (
                <div key={log.id}>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_120px_100px_40px] gap-2 md:gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    {/* User */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {log.user_email ?? (log.user_id ? 'User' : 'Anonymous')}
                      </p>
                      {log.user_id && (
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {log.user_id.slice(0, 8)}…
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${colorClass}`}
                      >
                        <Icon className="size-3" />
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.target_table && (
                        <span className="text-xs text-muted-foreground truncate">
                          → {log.target_table}
                        </span>
                      )}
                    </div>

                    {/* IP */}
                    <div className="text-xs text-muted-foreground font-mono">
                      {log.ip_address ?? '—'}
                    </div>

                    {/* Time */}
                    <div className="text-xs text-muted-foreground">
                      <p>{format(new Date(log.created_at), 'MMM d, HH:mm')}</p>
                      <p className="text-[10px]">{format(new Date(log.created_at), 'yyyy')}</p>
                    </div>

                    {/* Expand */}
                    <div className="flex items-center justify-end">
                      {hasDetails && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                          title="View details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && (
                    <div className="px-5 pb-4 bg-muted/20 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 mt-3">
                        Additional Details
                      </p>
                      <pre className="text-xs text-foreground bg-card border border-border rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
