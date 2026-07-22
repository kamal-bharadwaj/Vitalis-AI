import 'server-only'
import { createAdminClient } from './supabase/admin'
import * as Sentry from '@sentry/nextjs'

type AuditLogAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'view_document'
  | 'upload_document'
  | 'delete_document'
  | 'chat_query'
  | 'export_data'
  | 'delete_account'
  | 'recover_account'
  | 'admin_view_patient'
  | 'admin_view_logs'

interface LogActionParams {
  userId?: string
  action: AuditLogAction
  targetTable?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

export function logAction(params: LogActionParams): void {
  // Fire and forget — never blocks the request
  const supabase = createAdminClient()

  supabase
    .from('audit_logs')
    .insert({
      user_id: params.userId,
      action: params.action,
      target_table: params.targetTable,
      target_id: params.targetId,
      details: params.details || {},
      ip_address: params.ipAddress,
    })
    .then(({ error }: { error: unknown }) => {
      if (error) {
        console.error('Failed to write audit log:', error)
        // Report DB write failures to Sentry (non-fatal)
        Sentry.captureException(error, {
          tags: { component: 'audit-logger' },
          extra: { action: params.action, userId: params.userId },
        })
      }
    })
}

// Helper to log from request context (extracts IP from headers)
export function logActionFromRequest(
  request: Request,
  params: Omit<LogActionParams, 'ipAddress'>
): void {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined

  logAction({ ...params, ipAddress: ip })
}
