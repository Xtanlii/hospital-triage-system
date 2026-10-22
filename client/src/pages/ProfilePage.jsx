import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Phone, Building2, Calendar, CheckCircle2 } from 'lucide-react';


export const ProfilePage = () => {
  const { currentUser, role } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User className="text-clinical-600" size={20} />
          <span>Staff Account & Duty Terminal</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Active clinical session details and professional hospital credentials.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-clinical-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {currentUser?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'}
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentUser?.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full bg-clinical-50 dark:bg-clinical-950/60 text-clinical-700 dark:text-clinical-400 border border-clinical-200 dark:border-clinical-800">
                <Shield size={12} />
                {role}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {currentUser?.departmentName || 'Emergency Medicine'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} />
                Shift Active
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
              Official Hospital Email
            </span>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400 dark:text-slate-500" />
              <span>{currentUser?.email}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
              Phone Contact
            </span>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400 dark:text-slate-500" />
              <span>{currentUser?.phone || '+234 800 123 4567'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
              Assigned Clinical Unit
            </span>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400 dark:text-slate-500" />
              <span>{currentUser?.departmentName || 'Emergency Care Stream'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
              Terminal Identifier
            </span>
            <div className="font-mono font-semibold text-slate-900 dark:text-white">
              CLINICAL-NODE-04 (Lagos Central)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};