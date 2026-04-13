import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
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
  
  // Settings State
  const [cascadeDelete, setCascadeDelete] = useState(() => {
    return localStorage.getItem('cascadeDelete') === 'true';
  });

  const handleToggleCascade = () => {
    const newVal = !cascadeDelete;
    setCascadeDelete(newVal);
    localStorage.setItem('cascadeDelete', String(newVal));
  };

  // Danger Zone State
  const [deleteConfirmStr, setDeleteConfirmStr] = useState('');
  const [isDeletingData, setIsDeletingData] = useState(false);

  const confirmTarget = (user?.email || 'CONFIRM').trim();

  const handleDeleteAllData = async () => {
    if (!user || deleteConfirmStr.trim() !== confirmTarget) return;
    setIsDeletingData(true);
    
    try {
      const collectionsToWipe = ['meetings', 'actionItems', 'decisions'];
      
      for (const collName of collectionsToWipe) {
        let hasMore = true;
        while (hasMore) {
          const q = query(collection(db, collName), where('authorId', '==', user.uid));
          const snap = await getDocs(q);
          
          if (snap.empty) {
            hasMore = false;
            break;
          }
          
          const batch = writeBatch(db);
          snap.docs.forEach(docSnap => batch.delete(docSnap.ref));
          await batch.commit();
        }
      }
      
      alert("All your generated data has been permanently deleted.");
      setIsSettingsModalOpen(false);
      setDeleteConfirmStr('');
    } catch (err) {
      console.error("Failed to delete all data:", err);
      alert("Failed to securely delete data. Please check connection.");
    } finally {
      setIsDeletingData(false);
    }
  };

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
        <h2 className="text-xl font-bold mb-4 text-primary">Preferences & Settings</h2>
        <div className="text-on-surface-variant mb-6 space-y-4">
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-sm text-on-surface font-headline">Cascade Deletions</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  When enabled, deleting a meeting will also permanently delete all decisions and pending action items associated with it. When disabled, action items will persist safely.
                </p>
              </div>
              <button 
                onClick={handleToggleCascade}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${cascadeDelete ? 'bg-error' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${cascadeDelete ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 p-4 bg-error/5 rounded-xl border border-error/30 flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-sm text-error font-headline">Danger Zone: Delete All Data</h3>
              <p className="text-xs text-error/80 mt-1 leading-relaxed">
                Permanently purge all your transcripts, extracted action items, and strategic decisions from the Narrative Ecosystem. This cannot be undone. Account will remain active.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-error/80 ml-1">
                Type "{confirmTarget}" to confirm
              </label>
              <input 
                type="text" 
                value={deleteConfirmStr}
                onChange={(e) => setDeleteConfirmStr(e.target.value)}
                placeholder="Match string exactly..."
                className="w-full bg-white border border-error/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-error focus:border-error placeholder:text-slate-300"
              />
              <button 
                onClick={handleDeleteAllData}
                disabled={deleteConfirmStr.trim() !== confirmTarget || isDeletingData}
                className={`mt-2 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
                  ${deleteConfirmStr.trim() === confirmTarget && !isDeletingData
                    ? 'bg-error text-white hover:bg-error/90 shadow-sm shadow-error/20' 
                    : 'bg-error/10 text-error/40 cursor-not-allowed'}`}
              >
                {isDeletingData ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isDeletingData ? 'Purging Systems...' : 'Permanently Delete Data'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 text-primary font-bold hover:bg-surface-container-high transition-colors rounded-lg text-sm"
          >
            Close Settings
          </button>
        </div>
      </Modal>
    </>
  );
};