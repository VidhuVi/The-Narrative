import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
};

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  };

  const handleClose = (value: boolean) => {
    if (confirmState) {
      confirmState.resolve(value);
      setConfirmState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose(false)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/10"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmState.options.type === 'danger' ? 'bg-error/10 text-error' : 'bg-amber-100 text-amber-600'
                    }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-primary font-headline tracking-tight">
                    {confirmState.options.title}
                  </h2>
                </div>

                <p className="text-on-surface-variant font-medium leading-relaxed mb-8">
                  {confirmState.options.message}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleClose(false)}
                    className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-on-surface-variant bg-surface-container-high hover:bg-primary/10 transition-colors"
                  >
                    {confirmState.options.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm hover:bg-primary/10 text-white shadow-lg transition-all active:scale-95 ${confirmState.options.type === 'danger'
                      ? 'bg-error shadow-error/20 hover:bg-red-700'
                      : 'bg-primary shadow-primary/20 hover:opacity-90'
                      }`}
                  >
                    {confirmState.options.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleClose(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-primary transition-colors opacity-0 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
