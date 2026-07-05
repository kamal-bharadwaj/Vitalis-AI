import 'server-only'
import { notFound } from 'next/navigation'
import { createClient } from './supabase/server'

/**
 * Verifies that the current user owns the target resource.
 * Throws a 404 (not 403) to prevent ID enumeration/data leakage.
 */
export async function verifyOwnership(
  userId: string, 
  table: string, 
  resourceId: string, 
  ownerColumn: string = 'patient_id'
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from(table)
    .select(ownerColumn)
    .eq('id', resourceId)
    .single()

  if (error || !data || (data as unknown as Record<string, unknown>)[ownerColumn] !== userId) {
    notFound() // Triggers the Next.js 404 page
  }
  
  return true
}
