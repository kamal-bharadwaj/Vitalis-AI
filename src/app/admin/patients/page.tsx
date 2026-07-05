import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PatientsTable from '@/components/admin/patients-table'
import { Users, Search } from 'lucide-react'

// 🔒 No-cache — sensitive admin data must never be cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Patients',
}

async function getAllPatients(search?: string) {
  const supabase = await createClient()

  let query = supabase
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

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: patients } = await query

  if (!patients?.length) return []

  // Document counts per patient
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

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const patients = await getAllPatients(search)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <Users className="size-4" />
          <span>Admin Panel</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Patients</h1>
        <p className="text-muted-foreground mt-1">
          {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
        />
      </form>

      {/* Table */}
      <PatientsTable patients={patients} />
    </div>
  )
}
