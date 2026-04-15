import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Intelligence } from './pages/Intelligence';
import { Workstream } from './pages/Workstream';
import { Chat } from './pages/Chat';
import { Landing } from './pages/Landing';
import { Help } from './pages/Help';
import { LogIn, BrainCircuit, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/Confirm';

const AppContent: React.FC = () => {
  const { user, loading, login } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-sm font-bold text-primary uppercase tracking-widest">Narrative Intelligence Hub</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing onLogin={login} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onMeetingClick={(id) => { setSelectedMeetingId(id); setActiveTab('intelligence'); }} onUploadClick={() => setActiveTab('upload')} onViewAllActions={() => setActiveTab('workstream')} />;
      case 'upload':
        return <Upload onComplete={() => setActiveTab('dashboard')} />;
      case 'intelligence':
        return selectedMeetingId ? <Intelligence meetingId={selectedMeetingId} /> : (
          <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl shadow-sm border border-outline-variant/10 max-w-2xl mx-auto mt-10">
            <BrainCircuit className="w-16 h-16 text-primary/20 mb-6" />
            <h2 className="text-2xl font-black text-primary font-headline tracking-tight mb-2">No Context Selected</h2>
            <p className="text-on-surface-variant max-w-sm mx-auto mb-8 font-body leading-relaxed">Please return to the Master Dashboard and select a specific transcript to generate or view its intelligence narrative.</p>
            <button onClick={() => setActiveTab('dashboard')} className="px-6 py-3 bg-primary text-white font-bold tracking-tight uppercase text-sm rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
              Return to Dashboard
            </button>
          </div>
        );
      case 'workstream':
        return <Workstream  />;
      case 'chat':
        return <Chat />;
      case 'help':
        return <Help />;
      default:
        return <Dashboard onMeetingClick={(id) => { setSelectedMeetingId(id); setActiveTab('intelligence'); }} onUploadClick={() => setActiveTab('upload')} onViewAllActions={() => setActiveTab('workstream')} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'upload': return 'Upload Transcript';
      case 'intelligence': return 'Meeting Intelligence';
      case 'workstream': return 'Tasks & Decisions';
      case 'chat': return 'Global Inquiry';
      case 'help': return 'Documentation & Help';
      default: return 'The Narrative';
    }
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0 ml-64">
        <TopBar title={getPageTitle()} />
        
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AppContent />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
