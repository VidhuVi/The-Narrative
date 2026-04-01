import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useState, useEffect } from 'react';

interface TopBarProps {
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'meetings'), where('authorId', '==', user.uid), where('status', '==', 'processed'));
    const unsubscribe = onSnapshot(q, (snapshot) => setProcessedCount(snapshot.size));
    return unsubscribe;
  }, [user]);

  return (
    <header className="w-full top-0 sticky z-40 bg-surface flex justify-between items-center px-10 h-20 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <h2 className="font-headline font-black text-2xl text-primary tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => alert(processedCount > 0 ? `You have ${processedCount} fully processed transcripts ready for review.` : "All transcripts processed. Nothing new.")} className="p-2.5 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl relative group">
            <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
            {processedCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>}
          </button>
          <button onClick={() => alert("Settings panel coming soon.")} className="p-2.5 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl group">
            <Settings className="w-5 h-5 group-hover:text-primary transition-colors" />
          </button>
          <button 
            onClick={logout}
            title="Sign Out"
            className="h-10 w-10 rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant/20 shadow-sm hover:ring-2 hover:ring-error/50 transition-all group relative"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-black text-primary group-hover:text-error transition-colors">
                {user?.displayName?.[0] || 'U'}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
