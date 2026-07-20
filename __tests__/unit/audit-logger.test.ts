import { describe, it, expect } from 'vitest'
import { logAction } from '@/lib/audit-logger'
import { createAdminClient } from '@/lib/supabase/admin'

describe('logAction', () => {
  it('should format and insert the log action into the audit_logs table', () => {
    const supabase = createAdminClient()

    logAction({
      userId: 'user-123',
      action: 'login',
      targetTable: 'profiles',
      targetId: 'profile-123',
      details: { success: true },
      ipAddress: '192.168.1.1',
    })

    // Verify it targeted the 'audit_logs' table
    expect(supabase.from).toHaveBeenCalledWith('audit_logs')

    // Verify the insertion payload is correctly formatted
    expect(supabase.from('audit_logs').insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      action: 'login',
      target_table: 'profiles',
      target_id: 'profile-123',
      details: { success: true },
      ip_address: '192.168.1.1',
    })
  })

  it('should default details to an empty object if not provided', () => {
    const supabase = createAdminClient()

    logAction({
      userId: 'user-456',
      action: 'logout',
    })

    expect(supabase.from('audit_logs').insert).toHaveBeenCalledWith({
      user_id: 'user-456',
      action: 'logout',
      target_table: undefined,
      target_id: undefined,
      details: {},
      ip_address: undefined,
    })
  })
})
