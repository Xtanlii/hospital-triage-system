import React from 'react';
import { Clock, BellRing, Stethoscope, CheckCircle, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const configs = {
    'Waiting': {
      class: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      icon: Clock,
      dot: 'bg-slate-400 dark:bg-slate-500'
    },
    'Called': {
      class: 'bg-clinical-50 text-clinical-800 border-clinical-300 dark:bg-clinical-950/60 dark:text-clinical-300 dark:border-clinical-800 animate-pulse',
      icon: BellRing,
      dot: 'bg-clinical-500'
    },
    'In Consultation': {
      class: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
      icon: Stethoscope,
      dot: 'bg-purple-500'
    },
    'Completed': {
      class: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      icon: CheckCircle,
      dot: 'bg-emerald-500'
    },
    'Cancelled': {
      class: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      icon: XCircle,
      dot: 'bg-rose-500'
    }
  };

  const config = configs[status] || configs['Waiting'];
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-lg ${config.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <IconComponent size={12} />
      <span>{status}</span>
    </span>
  );
};
