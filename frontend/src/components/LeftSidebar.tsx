import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  MessageSquare, 
  Utensils, 
  Activity, 
  History, 
  Settings,
  User,
  Moon,
  Database
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Medical Records', icon: FileText },
  { name: 'Uploads', icon: Upload },
  { name: 'AI Consultation', icon: MessageSquare },
  { name: 'Recipes', icon: Utensils },
  { name: 'Health Insights', icon: Activity },
  { name: 'History', icon: History },
  { name: 'Settings', icon: Settings },
];

export default function LeftSidebar() {
  return (
    <aside className="w-[280px] bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 text-sm overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-blue-600 tracking-tight">Vitalis AI</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a 
              key={item.name}
              href="#" 
              className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors"
            >
              <Icon size={18} className="text-gray-500" />
              {item.name}
            </a>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className="flex flex-col gap-2">
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
          
          <div className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-gray-500" />
              <span>Theme</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer mt-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              JD
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">John Doe</span>
              <span className="text-xs text-gray-500">Patient Profile</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
