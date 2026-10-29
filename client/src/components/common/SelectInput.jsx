import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize options to array of { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { 
        value: opt.value, 
        label: opt.label !== undefined ? opt.label : String(opt.value) 
      };
    }
    return { value: opt, label: String(opt) };
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          id,
          name: id,
          value: val
        }
      });
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-medium transition-all text-left ${
            error
              ? 'border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-200'
              : isOpen
                ? 'border-clinical-500 ring-2 ring-clinical-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                : 'border-slate-300 bg-white text-slate-900 hover:border-clinical-500 hover:ring-1 hover:ring-clinical-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-clinical-400'
          } ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-400 opacity-60' : 'cursor-pointer shadow-xs'}`}
        >
          <span className={`truncate ${!selectedOption && placeholder ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100 font-semibold'}`}>
            {displayText}
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 ml-2 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-clinical-600 dark:text-clinical-400' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-emerald-500/25 bg-white dark:bg-slate-900 shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.7),0_0_15px_rgba(16,185,129,0.1)] py-1 text-xs">
            {normalizedOptions.length === 0 ? (
              <div className="px-3.5 py-2 text-slate-400 dark:text-slate-500 italic">No options available</div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-clinical-600 text-white font-bold hover:bg-clinical-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                        : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-clinical-500 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="shrink-0 text-white ml-2" />}
                  </button>
                );
              })
            )}
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
