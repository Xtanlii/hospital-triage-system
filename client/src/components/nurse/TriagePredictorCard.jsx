import React from 'react';
import { Bot, Sparkles, ShieldAlert, AlertTriangle, RotateCw } from 'lucide-react';
import { TriageBadge } from '../common/TriageBadge';

const COLOUR_SWATCH = {
  Red: 'bg-rose-600 text-white border-rose-700',
  Orange: 'bg-orange-500 text-white border-orange-600',
  Yellow: 'bg-amber-400 text-slate-950 border-amber-500',
  Green: 'bg-blue-600 text-white border-blue-700',
  Blue: 'bg-blue-600 text-white border-blue-700'
};

export const TriagePredictorCard = ({
  predictionResult,
  isLoading,
  onRunPrediction,
  canRun = true
}) => {
  const triageColour = predictionResult?.triage_label || predictionResult?.color || 'Yellow';
  const swatchClass = COLOUR_SWATCH[triageColour] || COLOUR_SWATCH.Yellow;

  return (
    <div className="rounded-xl border border-clinical-200 dark:border-clinical-900 bg-gradient-to-b from-clinical-50/40 to-white dark:from-clinical-950/20 dark:to-slate-900 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-clinical-600 text-white shadow-xs">
            <Bot size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>ML Triage Predictor</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-clinical-100 dark:bg-clinical-950/60 text-clinical-800 dark:text-clinical-400 border border-clinical-200 dark:border-clinical-800">
                XGBoost Active
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clinical Decision Support (XGBoost Classifier · MIMIC-IV-ED)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRunPrediction}
          disabled={!canRun || isLoading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
            isLoading
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              : !canRun
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : 'bg-clinical-600 text-white hover:bg-clinical-700 active:scale-98 cursor-pointer'
          }`}
        >
          {isLoading ? (
            <>
              <RotateCw size={14} className="animate-spin" />
              <span>Analyzing Vitals & Symptoms...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Run Triage Prediction</span>
            </>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-clinical-50 dark:bg-clinical-950/50 text-clinical-600 animate-pulse">
            <Bot size={28} />
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Evaluating 38 clinical features against XGBoost triage model...
          </p>
        </div>
      ) : predictionResult ? (
        <div className="space-y-4">
          {/* Manual Assessment Prompt when fewer than 3 core vitals are usable */}
          {predictionResult.manual_assessment_recommended && (
            <div
              data-testid="manual-assessment-prompt"
              className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
            >
              <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-sm text-rose-800 dark:text-rose-200">
                  Assess Manually — Manual Clinical Assessment Recommended
                </p>
                <p className="text-rose-700 dark:text-rose-300 leading-relaxed">
                  Fewer than 3 usable core vital signs were provided (e.g., unconscious or partial intake data). Treat this prediction with caution, assess the patient manually at bedside, and override the triage level below if clinically indicated.
                </p>
                {Array.isArray(predictionResult.missing_fields) && predictionResult.missing_fields.length > 0 && (
                  <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                    Uncollected / imputed fields: <span className="font-mono">{predictionResult.missing_fields.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {Array.isArray(predictionResult.ignored_out_of_range) && predictionResult.ignored_out_of_range.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="font-bold">Out-of-range vitals treated as missing: </span>
              <span className="font-mono">{predictionResult.ignored_out_of_range.join(', ')}</span>
            </div>
          )}

          {/* Prominent Acuity Level & Triage Colour Display */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Predicted Acuity Level
                </span>
                <div className="flex items-center gap-2.5">
                  <TriageBadge 
                    level={predictionResult.prediction} 
                    size="lg" 
                    pulse={predictionResult.prediction === 'Immediate' || predictionResult.acuity === 1} 
                  />
                  {predictionResult.acuity && (
                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Acuity {predictionResult.acuity} of 5
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Triage Colour Tag
                </span>
                <span className={`inline-flex items-center gap-1.5 text-sm font-extrabold px-3.5 py-1.5 rounded-lg border shadow-xs ${swatchClass}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80" />
                  <span>{triageColour}</span>
                </span>
              </div>
            </div>

            {predictionResult.rationale && (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-150 dark:border-slate-700 leading-relaxed">
                <span className="font-bold text-slate-700 dark:text-slate-200">Assessment Summary: </span>
                {predictionResult.rationale}
              </div>
            )}

            {/* Subtle relative probability scores */}
            {predictionResult.probabilities && (
              <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                <span>Relative class scores (not exact percentages):</span>
                <div className="flex items-center gap-2 font-mono">
                  {Object.entries(predictionResult.probabilities).map(([lvl, score]) => (
                    <span
                      key={lvl}
                      className={Number(lvl) === Number(predictionResult.acuity) ? 'font-bold text-slate-700 dark:text-slate-200' : ''}
                    >
                      L{lvl}: {Number(score).toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Clinical Disclaimers */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">AI-Assisted Decision Support Notice</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                This model supports clinical judgement and does not replace it. Nurses and physicians can always override the predicted acuity level below.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 dark:text-slate-500 space-y-1">
          <p className="text-xs font-medium">Enter patient vitals and chief complaint above, then click</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">"Run Triage Prediction"</p>
        </div>
      )}
    </div>
  );
};
