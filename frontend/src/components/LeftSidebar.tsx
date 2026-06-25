"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FileText, Upload, MessageSquare,
  Utensils, Activity, History, Settings,
  Moon, Database, LogOut, ShieldCheck
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Medical Records', icon: FileText, href: '/dashboard' },
  { name: 'Uploads', icon: Upload, href: '/dashboard' },
  { name: 'AI Consultation', icon: MessageSquare, href: '/dashboard' },
  { name: 'Recipes', icon: Utensils, href: '/dashboard' },
  { name: 'Health Insights', icon: Activity, href: '/dashboard' },
  { name: 'History', icon: History, href: '/dashboard' },
  { name: 'Settings', icon: Settings, href: '/dashboard' },
];

export default function LeftSidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const pathname = usePathname();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Patient';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email || '';

  return (
    <aside className="w-[280px] bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 text-sm overflow-y-auto z-20">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Vitalis AI</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} className={active ? 'text-blue-600' : 'text-gray-500'} />
              {item.name}
            </Link>
          );
        })}

        {/* Admin link — only visible to admins */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors mt-2 ${
              pathname === '/admin'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck size={18} className={pathname === '/admin' ? 'text-blue-600' : 'text-gray-500'} />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex flex-col gap-2">
          {/* Storage meter */}
          <div className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
            <Database size={18} className="text-gray-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span>Storage</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>

          {/* Theme toggle placeholder */}
          <div className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-gray-500" />
              <span>Theme</span>
            </div>
          </div>

          {/* User profile + sign out */}
          <div className="mt-1 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt={displayName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
