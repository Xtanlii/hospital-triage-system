import React, { useState } from 'react';
import { 
  Activity as LucideActivity,
  HeartPulse as LucideHeartPulse,
  Stethoscope as LucideStethoscope,
  Users as LucideUsers,
  Clock as LucideClock,
  AlertTriangle as LucideAlertTriangle,
  CheckCircle2 as LucideCheckCircle,
  Bed as LucideBed,
  FileText as LucideFileText,
  Shield as LucideShield,
  Search as LucideSearch,
  Sparkles as LucideSparkles,
  X as LucideX
} from 'lucide-react';

import {
  IconActivity,
  IconHeartRateMonitor,
  IconStethoscope,
  IconUsers,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck,
  IconBed,
  IconFileText,
  IconShield,
  IconSearch,
  IconSparkles
} from '@tabler/icons-react';

import {
  HeartIcon as HeroHeart,
  UserGroupIcon as HeroUsers,
  ClockIcon as HeroClock,
  ExclamationTriangleIcon as HeroExclamation,
  CheckCircleIcon as HeroCheck,
  DocumentTextIcon as HeroDocument,
  ShieldCheckIcon as HeroShield,
  MagnifyingGlassIcon as HeroSearch,
  SparklesIcon as HeroSparkles
} from '@heroicons/react/24/outline';

export const IconComparisonModal = ({ isOpen, onClose }) => {
  const [selectedSet, setSelectedSet] = useState('all');

  if (!isOpen) return null;

  const ICON_PAIRS = [
    {
      name: 'Vitals / Heart Pulse',
      description: 'Used for heart rate, live vitals, and cardiac metrics',
      lucide: <LucideHeartPulse className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      tabler: <IconHeartRateMonitor className="w-6 h-6 text-emerald-600 dark:text-emerald-400" stroke={1.8} />,
      hero: <HeroHeart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
    },
    {
      name: 'Activity / Triage Monitor',
      description: 'Used for patient stream and real-time triage status',
      lucide: <LucideActivity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      tabler: <IconActivity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" stroke={1.8} />,
      hero: <HeroHeart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
    },
    {
      name: 'Clinical Care / Stethoscope',
      description: 'Used for doctor stations and consultation queues',
      lucide: <LucideStethoscope className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      tabler: <IconStethoscope className="w-6 h-6 text-emerald-600 dark:text-emerald-400" stroke={1.8} />,
      hero: <HeroDocument className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
    },
    {
      name: 'Patient Roster / Queue',
      description: 'Used for patient lists, queue count, and roster management',
      lucide: <LucideUsers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      tabler: <IconUsers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" stroke={1.8} />,
      hero: <HeroUsers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
    },
    {
      name: 'Time / Wait Clock',
      description: 'Used for triage wait times and queue timestamps',
      lucide: <LucideClock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      tabler: <IconClock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" stroke={1.8} />,
      hero: <HeroClock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
    },
    {
      name: 'Urgent / Red Alert',
      description: 'Used for Immediate triage and high-risk flags',
      lucide: <LucideAlertTriangle className="w-6 h-6 text-rose-500" />,
      tabler: <IconAlertTriangle className="w-6 h-6 text-rose-500" stroke={1.8} />,
      hero: <HeroExclamation className="w-6 h-6 text-rose-500" />
    },
    {
      name: 'Success / Completed',
      description: 'Used for discharged patients and completed triage audits',
      lucide: <LucideCheckCircle className="w-6 h-6 text-emerald-500" />,
      tabler: <IconCircleCheck className="w-6 h-6 text-emerald-500" stroke={1.8} />,
      hero: <HeroCheck className="w-6 h-6 text-emerald-500" />
    },
    {
      name: 'Bed / Hospital Ward',
      description: 'Used for inpatient admissions and ward assignments',
      lucide: <LucideBed className="w-6 h-6 text-indigo-500" />,
      tabler: <IconBed className="w-6 h-6 text-indigo-500" stroke={1.8} />,
      hero: <HeroDocument className="w-6 h-6 text-indigo-500" />
    },
    {
      name: 'Clinical Audit / AI Prediction',
      description: 'Used for ML decision support and explanation badges',
      lucide: <LucideSparkles className="w-6 h-6 text-amber-500" />,
      tabler: <IconSparkles className="w-6 h-6 text-amber-500" stroke={1.8} />,
      hero: <HeroSparkles className="w-6 h-6 text-amber-500" />
    },
    {
      name: 'Security / Compliance',
      description: 'Used for HIPAA/NDPR safeguards and nurse override authorization',
      lucide: <LucideShield className="w-6 h-6 text-teal-500" />,
      tabler: <IconShield className="w-6 h-6 text-teal-500" stroke={1.8} />,
      hero: <HeroShield className="w-6 h-6 text-teal-500" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Design System Evaluation
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Medical Icon Sets Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side evaluation of Lucide, Tabler, and Heroicons for clinical ergonomics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LucideX size={18} />
          </button>
        </div>

        {/* Legend & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Filter View:</span>
            <button
              onClick={() => setSelectedSet('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSet === 'all' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Side-by-Side (All 3)
            </button>
            <button
              onClick={() => setSelectedSet('lucide')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSet === 'lucide' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Lucide Only
            </button>
            <button
              onClick={() => setSelectedSet('tabler')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSet === 'tabler' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Tabler Only
            </button>
            <button
              onClick={() => setSelectedSet('hero')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSet === 'hero' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Heroicons Only
            </button>
          </div>
          <div className="text-[11px] text-slate-400">
            Current recommendation: <strong className="text-emerald-700 dark:text-emerald-400">Lucide + Tabler Medical extensions</strong>
          </div>
        </div>

        {/* Content Table / Grid */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="grid grid-cols-12 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Use Case / Concept</div>
            {(selectedSet === 'all' || selectedSet === 'lucide') && (
              <div className={selectedSet === 'all' ? 'col-span-2 text-center' : 'col-span-8 text-center'}>
                Lucide React
              </div>
            )}
            {(selectedSet === 'all' || selectedSet === 'tabler') && (
              <div className={selectedSet === 'all' ? 'col-span-3 text-center' : 'col-span-8 text-center'}>
                @tabler/icons-react
              </div>
            )}
            {(selectedSet === 'all' || selectedSet === 'hero') && (
              <div className={selectedSet === 'all' ? 'col-span-3 text-center' : 'col-span-8 text-center'}>
                @heroicons/react
              </div>
            )}
          </div>

          {ICON_PAIRS.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 py-3.5 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors">
              <div className="col-span-4 pr-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.name}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{item.description}</div>
              </div>

              {(selectedSet === 'all' || selectedSet === 'lucide') && (
                <div className={`${selectedSet === 'all' ? 'col-span-2' : 'col-span-8'} flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800`}>
                  {item.lucide}
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">Lucide</span>
                </div>
              )}

              {(selectedSet === 'all' || selectedSet === 'tabler') && (
                <div className={`${selectedSet === 'all' ? 'col-span-3' : 'col-span-8'} flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800`}>
                  {item.tabler}
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">Tabler</span>
                </div>
              )}

              {(selectedSet === 'all' || selectedSet === 'hero') && (
                <div className={`${selectedSet === 'all' ? 'col-span-3' : 'col-span-8'} flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800`}>
                  {item.hero}
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">Heroicons</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Installed packages: <code className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">lucide-react</code>, <code className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">@tabler/icons-react</code>, <code className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">@heroicons/react</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close Evaluation
          </button>
        </div>
      </div>
    </div>
  );
};

