import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchBar } from '../../components/common/SearchBar';
import { Layers, Clock, Filter, ShieldCheck } from 'lucide-react';


export const SystemActivityPage = () => {
  const { activities } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = activities.filter(act => 
    act.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="text-clinical-600" size={22} />
            <span>Clinical Audit & System Activity Log</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable transaction log of patient intakes, triage assessments, clinical calls, and overrides.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Logged Events: <strong className="text-slate-900 dark:text-white">{activities.length}</strong>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search activity log by keyword, staff name, or event type..."
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No activity logs match your search.
            </div>
          ) : (
            filteredActivities.map(act => (
              <div key={act.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-clinical-50 dark:bg-clinical-950/60 text-clinical-700 dark:text-clinical-400 border border-clinical-200 dark:border-clinical-800">
                      {act.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {act.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {act.message}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                  <Clock size={12} />
                  <span>{act.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};