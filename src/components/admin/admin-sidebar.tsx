'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Shield,
  ScrollText,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Patients',
    href: '/admin/patients',
    icon: Users,
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ScrollText,
  },
]

interface AdminSidebarProps {
  adminName: string
  adminEmail: string
}

interface SidebarContentProps {
  adminName: string
  adminEmail: string
  pathname: string
  onLinkClick: () => void
}

function SidebarContent({
  adminName,
  adminEmail,
  pathname,
  onLinkClick,
}: SidebarContentProps) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="size-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <Shield className="size-4 text-sidebar-primary-foreground" />
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sidebar-foreground text-sm leading-tight">MedicBot</p>
          <p className="text-xs text-sidebar-foreground/50 truncate">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="px-3 py-2 rounded-lg bg-sidebar-accent/30">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{adminName}</p>
          <p className="text-xs text-sidebar-foreground/50 truncate">{adminEmail}</p>
        </div>
        <form action={logout}>
          <button
            id="admin-logout"
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 size-10 rounded-lg bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'md:hidden fixed left-0 top-0 z-40 h-full w-64 bg-sidebar transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          adminName={adminName}
          adminEmail={adminEmail}
          pathname={pathname}
          onLinkClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        <SidebarContent
          adminName={adminName}
          adminEmail={adminEmail}
          pathname={pathname}
          onLinkClick={() => {}}
        />
      </aside>
    </>
  )
}
