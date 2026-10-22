import React from 'react';
import { ChevronDown } from 'lucide-react';

export const SelectInput = ({
  label,
  id,
  value,
  onChange,
  options = [],
  required = false,
  error = null,
  helperText = null,
  disabled = false,
  className = '',
  placeholder = 'Select an option'
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`block w-full appearance-none rounded-xl border px-3.5 py-2.5 pr-10 text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-200'
              : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-clinical-500 focus:ring-clinical-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600'
          } ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-400 opacity-60' : 'cursor-pointer shadow-xs'}`}
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val} className="dark:bg-slate-900 dark:text-slate-100">
                {lbl}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500">
          <ChevronDown size={15} />
        </div>
      </div>
      {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      {helperText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
