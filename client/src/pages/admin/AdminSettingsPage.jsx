import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, ShieldCheck, RotateCw, AlertTriangle, Save, BellRing } from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const AdminSettingsPage = () => {
  const { resetDemoData, showToast } = useApp();

  const [settings, setSettings] = useState({
    hospitalName: 'ApexCare Health System',
    emergencyTargetWait: 15,
    urgentTargetWait: 30,
    nonUrgentTargetWait: 60,
    criticalSpo2Threshold: 92,
    highHeartRateThreshold: 120,
    highBloodPressureSysThreshold: 180,
    aiModelConfidenceMinimum: 80,
    autoQueueTicking: true
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Settings Saved', 'Clinical queue parameters and alert thresholds updated.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="text-clinical-600" size={22} />
          <span>Clinical System Settings & Triage Parameters</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Hospital-wide clinical queue rules, triage alert thresholds, and demo environment control.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hospital Facility Profile */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Facility Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Hospital / Health Center Name</label>
              <input
                type="text"
                value={settings.hospitalName}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-clinical-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Clinical Protocol Standard</label>
              <input
                type="text"
                disabled
                value="Emergency Severity Index (ESI) 5-Tier System"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Triage Urgency Wait Targets */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Target Waiting Times (Minutes)</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Alert triggers when exceeded</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60">
              <label className="block font-bold text-rose-900 dark:text-rose-200">Immediate Target</label>
              <input
                type="number"
                value={settings.emergencyTargetWait}
                onChange={(e) => setSettings({ ...settings, emergencyTargetWait: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <span className="text-[10px] text-rose-700 dark:text-rose-400">Target &lt; 15 minutes</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
              <label className="block font-bold text-amber-900 dark:text-amber-200">Urgent Target</label>
              <input
                type="number"
                value={settings.urgentTargetWait}
                onChange={(e) => setSettings({ ...settings, urgentTargetWait: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-amber-700 dark:text-amber-400">Target &lt; 30 minutes</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
              <label className="block font-bold text-emerald-900 dark:text-emerald-200">Less Urgent Target</label>
              <input
                type="number"
                value={settings.nonUrgentTargetWait}
                onChange={(e) => setSettings({ ...settings, nonUrgentTargetWait: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Target &lt; 60 minutes</span>
            </div>
          </div>
        </div>

        {/* Vital Signs Critical Alert Cutoffs */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Physiological Vital Signs Alarm Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Critical Low SpO2 Alarm (%)</label>
              <input
                type="number"
                value={settings.criticalSpo2Threshold}
                onChange={(e) => setSettings({ ...settings, criticalSpo2Threshold: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-xs focus:ring-2 focus:ring-clinical-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Triggers Immediate prompt</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Tachycardia Cutoff (bpm)</label>
              <input
                type="number"
                value={settings.highHeartRateThreshold}
                onChange={(e) => setSettings({ ...settings, highHeartRateThreshold: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-xs focus:ring-2 focus:ring-clinical-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Default &gt; 120 bpm</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Severe Systolic BP (mmHg)</label>
              <input
                type="number"
                value={settings.highBloodPressureSysThreshold}
                onChange={(e) => setSettings({ ...settings, highBloodPressureSysThreshold: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-xs focus:ring-2 focus:ring-clinical-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Default &gt; 180 mmHg</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>

      {/* Demo Environment Management */}
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 p-5 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
              <span>Reset Prototype Data Store</span>
            </h3>
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed max-w-xl">
              Restore all mock data (patients, triage assessments, active queues, staff accounts, and activity logs) back to the clean Nigerian hospital seed dataset.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCw size={13} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetDemoData}
        title="Reset All Hospital Mock Data"
        message="Are you sure you want to reset all data? Any newly triaged patients, departments, or queue changes created during this test session will be restored to default."
        confirmText="Confirm Reset"
        isDestructive={true}
      />
    </div>
  );
};