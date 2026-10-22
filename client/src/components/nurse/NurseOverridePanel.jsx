import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { TriageBadge } from '../common/TriageBadge';

export const NurseOverridePanel = ({
  predictedLevel,
  finalLevel,
  onChangeFinalLevel,
  overrideReason,
  onChangeOverrideReason,
  overrideError
}) => {
  const normalize = (val) => {
    if (!val) return '';
    const str = String(val).trim().toLowerCase();
    if (str.includes('immediate') || str.includes('1') || str.includes('red')) return 'immediate';
    if (str.includes('emergent') || str.includes('2') || str.includes('orange')) return 'emergent';
    if (str.includes('urgent') && !str.includes('less') && !str.includes('non')) return 'urgent';
    if (str.includes('less') || str.includes('4') || str.includes('green')) return 'less urgent';
    if (str.includes('non') || str.includes('5') || str.includes('blue')) return 'non-urgent';
    return str;
  };

  const isOverridden = predictedLevel && finalLevel && normalize(predictedLevel) !== normalize(finalLevel);

  const triageOptions = [
    {
      level: 'Immediate',
      title: 'Immediate',
      desc: 'Immediate life threat. Immediate clinical intervention required.',
      colorClass: 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200',
      activeClass: 'ring-2 ring-rose-600 border-rose-600 bg-rose-100/80 dark:bg-rose-900/60 font-bold'
    },
    {
      level: 'Emergent',
      title: 'Emergent',
      desc: 'Severe distress, potential rapid deterioration (< 15 min).',
      colorClass: 'border-orange-400 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-200',
      activeClass: 'ring-2 ring-orange-600 border-orange-600 bg-orange-100/80 dark:bg-orange-900/60 font-bold'
    },
    {
      level: 'Urgent',
      title: 'Urgent',
      desc: 'Moderate distress, multiple resources needed (< 30-60 min).',
      colorClass: 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200',
      activeClass: 'ring-2 ring-amber-500 border-amber-500 bg-amber-100/80 dark:bg-amber-900/60 font-bold'
    },
    {
      level: 'Less Urgent',
      title: 'Less Urgent',
      desc: 'Mild stable distress. Simple diagnostic/treatment needed.',
      colorClass: 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200',
      activeClass: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/60 font-bold'
    },
    {
      level: 'Non-urgent',
      title: 'Non-urgent',
      desc: 'Routine clinic consult or prescription renewal.',
      colorClass: 'border-blue-400 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200',
      activeClass: 'ring-2 ring-blue-600 border-blue-600 bg-blue-100/80 dark:bg-blue-900/60 font-bold'
    }
  ];

  const commonOverrideReasons = [
    'Patient hemodynamics reassessed after rest and vital recheck.',
    'Underlying high-risk comorbidity (e.g. sickle cell crisis, brittle diabetes).',
    'Severe acute pain disproportionate to vital signs.',
    'Maternal or obstetric risk factors require higher vigilance.',
    'Pediatric patient exhibiting heightened irritability upon clinical exam.'
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Clinical Confirmation & 5-Level Triage
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confirm the AI recommendation or execute a clinical override based on professional triage assessment.
          </p>
        </div>

        {predictedLevel && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-semibold">AI Recommendation:</span>
            <TriageBadge level={predictedLevel} size="sm" />
          </div>
        )}
      </div>

      {/* 5 Clinical Cards for Final Triage Choice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {triageOptions.map(opt => {
          const isSelected = finalLevel && normalize(finalLevel) === normalize(opt.level);
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => onChangeFinalLevel(opt.level)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${opt.colorClass} ${
                isSelected 
                  ? opt.activeClass + ' shadow-xs' 
                  : 'opacity-70 hover:opacity-100 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{opt.title}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
                )}
              </div>
              <p className="text-[11px] leading-snug opacity-90">
                {opt.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Override Reason Field if Level differs from AI Prediction */}
      {isOverridden && (
        <div className="mt-4 p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Clinician Override Active: Prediction ({predictedLevel}) → Final Decision ({finalLevel})
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Please document the clinical rationale for overriding the AI recommendation. This is logged for clinical governance and model auditing.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Override Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={overrideReason}
              onChange={(e) => onChangeOverrideReason(e.target.value)}
              placeholder="e.g. Patient condition reassessed after vital signs. High-risk sickle cell history with low baseline SpO2..."
              className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 ${
                overrideError 
                  ? 'border-rose-400 focus:ring-rose-500/20' 
                  : 'border-slate-300 dark:border-slate-700 focus:ring-clinical-500/20 focus:border-clinical-500'
              }`}
            />
            {overrideError && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {overrideError}
              </p>
            )}

            {/* Quick reason chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold self-center">Quick presets:</span>
              {commonOverrideReasons.slice(0, 3).map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChangeOverrideReason(r)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                >
                  Preset {i+1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
