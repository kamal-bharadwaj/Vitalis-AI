import { requirePatient } from '@/lib/auth-guard'
import PatientSidebar from '@/components/patient/patient-sidebar'

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 🔒 Server-side role guard — redirects non-patients to /admin/dashboard
  const user = await requirePatient()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PatientSidebar
        patientName={user.user_metadata?.full_name || user.email || 'Patient'}
        patientEmail={user.email || ''}
      />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
