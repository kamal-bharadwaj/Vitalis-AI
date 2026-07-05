import 'server-only'
import { createAdminClient } from './supabase/admin'

type AuditLogAction = 
  | 'login' | 'login_failed' | 'logout' 
  | 'view_document' | 'upload_document' | 'delete_document' 
  | 'chat_query' | 'export_data' | 'delete_account' 
  | 'recover_account' | 'admin_view_patient' | 'admin_view_logs'

interface LogActionParams {
  userId?: string;
  action: AuditLogAction;
  targetTable?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export function logAction(params: LogActionParams): void {
  // Fire and forget, do not await
  const supabase = createAdminClient()
  
  supabase.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    target_table: params.targetTable,
    target_id: params.targetId,
    details: params.details || {},
    ip_address: params.ipAddress,
  }).then(({ error }: { error: unknown }) => {
    if (error) {
      console.error('Failed to write audit log:', error)
      // Since Sentry is in Phase 8/9, we can just console.error for now.
    }
  })
}
