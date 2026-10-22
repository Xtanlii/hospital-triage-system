import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badgeText = null,
  onClick = null,
  children = null
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200/90 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100',
    primary: 'bg-clinical-50/50 border-clinical-200/80 text-clinical-950 dark:bg-clinical-950/30 dark:border-clinical-800/60 dark:text-clinical-100',
    red: 'bg-rose-50/60 border-rose-200 text-rose-950 dark:bg-rose-950/30 dark:border-rose-800/60 dark:text-rose-100',
    amber: 'bg-amber-50/60 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-100',
    green: 'bg-emerald-50/60 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-100',
  };

  const iconStyles = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-clinical-100 text-clinical-700 dark:bg-clinical-900/60 dark:text-clinical-300',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-5 sm:p-6 rounded-2xl border shadow-xs transition-all duration-200 ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {value}
            </span>
            {badgeText && (
              <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shrink-0 ${iconStyles[variant]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {children}
        </div>
      )}
    </div>
  );
};
