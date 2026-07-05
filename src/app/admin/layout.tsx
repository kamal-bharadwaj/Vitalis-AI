import { requireAdmin } from '@/lib/auth-guard'
import AdminSidebar from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 🔒 Server-side role guard — redirects non-admins to /patient/dashboard
  const user = await requireAdmin()

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        adminName={user.user_metadata?.full_name || user.email || 'Admin'}
        adminEmail={user.email || ''}
      />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
