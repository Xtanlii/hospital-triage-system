import React from 'react';

export const FormInput = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error = null,
  helperText = null,
  disabled = false,
  className = '',
  suffix = null,
  min,
  max,
  step
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`block w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clinical-500/20 transition-all dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            error
              ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800'
              : 'border-slate-300 bg-white hover:border-slate-400 focus:border-clinical-500 dark:border-slate-700 dark:hover:border-slate-600'
          } ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-500 dark:text-slate-400' : ''} ${
            suffix ? 'pr-12' : ''
          }`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-xs font-semibold text-slate-400 dark:text-slate-500">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      {helperText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
