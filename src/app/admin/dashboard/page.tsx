import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/admin/stats-cards'
import PatientsTable from '@/components/admin/patients-table'
import { Shield, RefreshCcw } from 'lucide-react'

// 🔒 No-cache — sensitive admin data must never be cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

async function getDashboardStats() {
  const supabase = await createClient()

  const [
    { count: totalPatients },
    { count: totalDocuments },
    { count: processingDocuments },
    { count: totalChats },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalPatients: totalPatients ?? 0,
    totalDocuments: totalDocuments ?? 0,
    processingDocuments: processingDocuments ?? 0,
    totalChats: totalChats ?? 0,
  }
}

async function getRecentPatients() {
  const supabase = await createClient()

  const { data: patients } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      created_at
    `)
    .eq('role', 'patient')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get document counts for each patient
  if (!patients?.length) return []

  const patientIds = patients.map((p) => p.id)
  const { data: docCounts } = await supabase
    .from('documents')
    .select('patient_id')
    .in('patient_id', patientIds)

  const countMap: Record<string, number> = {}
  docCounts?.forEach((d) => {
    countMap[d.patient_id] = (countMap[d.patient_id] || 0) + 1
  })

  return patients.map((p) => ({
    ...p,
    document_count: countMap[p.id] || 0,
  }))
}

export default async function AdminDashboardPage() {
  const [stats, recentPatients] = await Promise.all([
    getDashboardStats(),
    getRecentPatients(),
  ])

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Shield className="size-4" />
            <span>Admin Panel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your MedicBot platform</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
          <RefreshCcw className="size-3" />
          Live data
        </div>
      </div>

      {/* Stats */}
      <StatsCards
        totalPatients={stats.totalPatients}
        totalDocuments={stats.totalDocuments}
        totalChats={stats.totalChats}
        processingDocuments={stats.processingDocuments}
      />

      {/* Recent Patients */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Patients</h2>
          <Link
            href="/admin/patients"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        <PatientsTable patients={recentPatients} />
      </div>
    </div>
  )
}
