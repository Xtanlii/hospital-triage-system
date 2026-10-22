import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />,
    error: <AlertCircle className="text-rose-600 shrink-0" size={18} />,
    warning: <AlertTriangle className="text-amber-600 shrink-0" size={18} />,
    info: <Info className="text-clinical-600 shrink-0" size={18} />
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 ring-1 ring-emerald-500/10 dark:ring-emerald-500/20',
    error: 'border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 ring-1 ring-rose-500/10 dark:ring-rose-500/20',
    warning: 'border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 ring-1 ring-amber-500/10 dark:ring-amber-500/20',
    info: 'border-clinical-200 dark:border-clinical-800 bg-white dark:bg-slate-900 ring-1 ring-clinical-500/10 dark:ring-clinical-500/20'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${borders[toast.type] || borders.info}`}
        >
          {icons[toast.type] || icons.info}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
