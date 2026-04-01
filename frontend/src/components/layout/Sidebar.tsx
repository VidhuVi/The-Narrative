import React from 'react';
import { LayoutDashboard, CloudUpload, BrainCircuit, MessageSquare, HelpCircle, LogOut, Plus, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload', icon: CloudUpload },
    { id: 'intelligence', label: 'Intelligence', icon: BrainCircuit },
    { id: 'workstream', label: 'Workstream', icon: CheckSquare },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container-low border-r border-outline-variant/10 z-50">
      <div className="flex flex-col h-full p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary leading-none font-headline tracking-tight">The Narrative</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black mt-1">Editorial Hub</p>
          </div>
        </div>

        <button 
          onClick={() => onTabChange('upload')}
          className="bg-primary text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/10 active:scale-95 transition-all hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          <span className="font-black text-sm uppercase tracking-wider">New Meeting</span>
        </button>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 transition-all rounded-xl group text-sm font-bold font-headline uppercase tracking-tight",
                activeTab === item.id 
                  ? "text-primary bg-white shadow-sm border-l-4 border-primary" 
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-primary" : "text-on-surface-variant group-hover:text-primary")} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-outline-variant/10 space-y-2">
          <button onClick={() => onTabChange('help')} className="w-full flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all rounded-xl group text-sm font-bold font-headline uppercase tracking-tight">
            <HelpCircle className="w-5 h-5 text-on-surface-variant group-hover:text-primary" />
            <span>Help</span>
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-all rounded-xl group text-sm font-bold font-headline uppercase tracking-tight"
          >
            <LogOut className="w-5 h-5 text-on-surface-variant group-hover:text-error" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
