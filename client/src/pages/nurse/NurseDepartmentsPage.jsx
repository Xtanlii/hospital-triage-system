import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Users, Clock, Bed, CheckCircle2 } from 'lucide-react';

export const NurseDepartmentsPage = () => {
  const { departments } = useApp();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Building2 className="text-clinical-600" size={20} />
          <span>Clinical Departments & Capacity Overview</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time bed capacities, active queue lengths, and on-duty clinical staffing levels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const loadPercent = Math.min(100, Math.round((dept.currentQueueLength / dept.capacity) * 100));
          const isHighLoad = loadPercent >= 75;

          return (
            <div 
              key={dept.id} 
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-clinical-100 dark:bg-clinical-950/60 text-clinical-800 dark:text-clinical-400 border border-clinical-200 dark:border-clinical-800">
                      {dept.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      dept.status === 'Active' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {dept.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {dept.name}
                  </h3>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Building2 size={20} />
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {dept.description || 'Clinical specialty care department.'}
              </p>

              {/* Progress bar of load */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Queue Load: {dept.currentQueueLength} / {dept.capacity}</span>
                  <span className={isHighLoad ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>{loadPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isHighLoad ? 'bg-rose-500' : loadPercent >= 50 ? 'bg-amber-500' : 'bg-clinical-600'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              </div>

              {/* Key Department Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">On-Duty Staff</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{dept.availableStaff} Clinicians</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Average Wait</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{dept.averageWaitTime} mins</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};