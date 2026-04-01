import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Intelligence } from './pages/Intelligence';
import { Workstream } from './pages/Workstream';
import { Chat } from './pages/Chat';
import { Landing } from './pages/Landing';
import { Help } from './pages/Help';
import { LogIn, BrainCircuit, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
        return selectedMeetingId ? <Intelligence meetingId={selectedMeetingId} /> : <Dashboard onMeetingClick={(id) => { setSelectedMeetingId(id); setActiveTab('intelligence'); }} onUploadClick={() => setActiveTab('upload')} onViewAllActions={() => setActiveTab('workstream')} />;
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
      <AppContent />
    </AuthProvider>
  );
}
