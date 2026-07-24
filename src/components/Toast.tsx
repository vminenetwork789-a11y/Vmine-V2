import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400" />,
    info: <Info className="h-5 w-5 text-amber-400" />,
  };

  const borderColors = {
    success: 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    error: 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    info: 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  };

  return (
    <div
      id="custom-toast"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border bg-slate-900/95 backdrop-blur-md text-white font-medium text-sm transition-all duration-300 transform translate-y-0 scale-100 ${borderColors[type]}`}
    >
      <div className="flex items-center justify-center">{icons[type]}</div>
      <span className="pr-2">{message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
