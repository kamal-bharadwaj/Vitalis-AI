import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return { ...user, role: profile?.role || 'patient' }
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/patient/dashboard')
  }
  return user
}

export async function requirePatient() {
  const user = await requireAuth()
  if (user.role !== 'patient') {
    redirect('/admin/dashboard')
  }
  return user
}
