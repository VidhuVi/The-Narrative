import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/firebase';
import Modal from './Modal';

interface TopBarProps {
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const [processedCount, setProcessedCount] = useState(0);

  // State for both modals
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'meetings'),
      where('authorId', '==', user.uid),
      where('status', '==', 'processed')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => setProcessedCount(snapshot.size));
    return unsubscribe;
  }, [user]);

  return (
    <>
      <header className="w-full top-0 sticky z-40 bg-surface flex justify-between items-center px-10 h-20 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <h2 className="font-headline font-black text-2xl text-primary tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">

            {/* Notification Button */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="p-2.5 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl relative group"
            >
              <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
              {processedCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl group"
            >
              <Settings className="w-5 h-5 group-hover:text-primary transition-colors" />
            </button>

            {/* Profile/Logout Button */}
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

      {/* Notification Modal */}
      <Modal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4 text-primary">Notifications</h2>
        <p className="text-on-surface-variant mb-6">
          {processedCount > 0
            ? `You have ${processedCount} fully processed transcripts ready for review.`
            : "All transcripts processed. Nothing new."}
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => setIsNotificationModalOpen(false)}
            className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4 text-primary">Settings</h2>
        <div className="text-on-surface-variant mb-6 space-y-4">
          <p>Settings panel coming soon.</p>
          {/* You can build out your actual settings form or toggles here later */}
          {/* <div className="p-4 bg-surface-container-high rounded-lg border border-outline-variant/20">
            <p className="text-sm">Future configuration options will go here.</p>
          </div> */}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Cancel
          </button>
          {/* <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button> */}
        </div>
      </Modal>
    </>
  );
};