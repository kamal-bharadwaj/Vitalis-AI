import 'server-only'
import { createAdminClient } from './supabase/admin'

interface NotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
}

export async function createNotification(params: NotificationParams) {
  const supabase = createAdminClient()
  
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
  })

  if (error) {
    console.error('Failed to create notification:', error)
  }
}
