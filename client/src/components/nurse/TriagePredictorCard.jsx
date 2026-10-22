import React from 'react';
import { Bot, Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon, RotateCw } from 'lucide-react';
import { TriageBadge } from '../common/TriageBadge';

export const TriagePredictorCard = ({
  predictionResult,
  isLoading,
  onRunPrediction,
  canRun = true
}) => {
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
                v2.4.1 Active
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clinical Decision Support (Random Forest Classifier)
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
            Evaluating vital signs and clinical narrative against triage protocols...
          </p>
        </div>
      ) : predictionResult ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  AI Model Predicted Level
                </span>
                <div>
                  <TriageBadge 
                    level={predictionResult.prediction} 
                    size="lg" 
                    pulse={predictionResult.prediction === 'RED' || predictionResult.prediction === 'LEVEL 1'} 
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Model Confidence
                </span>
                <span className="inline-flex items-center text-sm font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  {predictionResult.confidence}%
                </span>
              </div>
            </div>

            {predictionResult.rationale && (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-150 dark:border-slate-700 leading-relaxed">
                <span className="font-bold text-slate-700 dark:text-slate-200">Clinical Rationale: </span>
                {predictionResult.rationale}
              </div>
            )}
          </div>

          {/* Mandatory Clinical Disclaimers */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">AI-Assisted Decision Support Notice</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                This algorithm provides supportive diagnostic estimation only. The final triage level must be verified and confirmed by authorized clinical staff.
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
