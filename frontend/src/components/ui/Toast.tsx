import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const value = {
    toast: addToast,
    success: (m: string) => addToast(m, 'success'),
    error: (m: string) => addToast(m, 'error'),
    warn: (m: string) => addToast(m, 'warning'),
    info: (m: string) => addToast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <ToastItem toast={t} onClose={() => removeToast(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-primary" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-blue-50 border-blue-100',
  };

  return (
    <div className={`flex items-center gap-4 p-4 pr-12 rounded-2xl shadow-xl border ${bgColors[toast.type]} min-w-[320px] max-w-md relative overflow-hidden group`}>
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-bold text-slate-800 leading-tight">{toast.message}</p>
      <button 
        onClick={onClose}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
      
      {/* Timer progress bar mimic */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${
          toast.type === 'success' ? 'bg-emerald-500/20' : 
          toast.type === 'error' ? 'bg-error/20' : 
          toast.type === 'warning' ? 'bg-amber-500/20' : 'bg-primary/20'
        }`}
      />
    </div>
  );
};
