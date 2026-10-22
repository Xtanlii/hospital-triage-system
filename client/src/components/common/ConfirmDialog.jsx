import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-full shrink-0 ${
          isDestructive 
            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' 
            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
        }`}>
          <AlertTriangle size={20} />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
            isDestructive 
              ? 'bg-rose-600 hover:bg-rose-700' 
              : 'bg-clinical-600 hover:bg-clinical-700'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
