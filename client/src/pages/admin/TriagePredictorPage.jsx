import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/common/StatCard';
import { TriageBadge } from '../../components/common/TriageBadge';
import { 
  Bot, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Layers
} from 'lucide-react';

export const TriagePredictorPage = () => {
  const { triageModelStats, assessments } = useApp();

  const overriddenAssessments = assessments.filter(a => a.override);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="text-clinical-600" size={24} />
            <span>AI Triage Predictor Model Monitoring</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time validation metrics, clinical decision-support auditing, and nurse override telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Model v2.4.1 Active
          </span>
        </div>
      </div>

      {/* Strict Clinical Governance Notice */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">Clinical Decision-Support Component</h4>
          <p className="leading-relaxed text-amber-800 dark:text-amber-300">
            This machine learning model operates strictly as an auxiliary decision-support tool. It does not possess independent diagnostic authority. All triage urgency classifications require professional clinical validation by certified nursing staff.
          </p>
        </div>
      </div>

      {/* Model Performance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
        <StatCard
          title="Model Status"
          value="Online"
          subtitle="Inference latency ~800ms"
          icon={Bot}
          variant="primary"
        />
        <StatCard
          title="Clinical Accuracy"
          value={`${triageModelStats.accuracy}%`}
          subtitle="Against gold-standard"
          icon={CheckCircle2}
          variant="green"
        />
        <StatCard
          title="Total Predictions"
          value={triageModelStats.totalPredictions}
          subtitle="Cumulative shift evaluations"
          icon={Activity}
          variant="default"
        />
        <StatCard
          title="Immediate Flags"
          value={triageModelStats.redPredictions}
          subtitle="Immediate priority flagged"
          icon={AlertTriangle}
          variant="red"
        />
        <StatCard
          title="Nurse Overrides"
          value={triageModelStats.totalOverrides}
          subtitle={`Rate: ${triageModelStats.overrideRate}`}
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Architecture"
          value="RF-v2"
          subtitle="Random Forest Classifier"
          icon={Layers}
          variant="default"
        />
      </div>

      {/* Override Telemetry Analysis */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Clinician Override Frequency Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analysis of instances where attending triage nurses modified the AI prediction based on physical bedside exam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {triageModelStats.overrideBreakdown.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TriageBadge level={item.from} size="sm" />
                  <span className="text-slate-400 dark:text-slate-500 font-bold">→</span>
                  <TriageBadge level={item.to} size="sm" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                  {item.count} events
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                <span className="font-bold text-slate-700 dark:text-slate-200">Primary Rationale: </span>
                {item.commonReason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Live Overridden Cases Log */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Flagged Clinician Overrides in Active Shift
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Individual assessment cases requiring mandatory clinical rationale logging.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Nurse Reviewer</th>
                <th className="py-3 px-4">AI Prediction</th>
                <th className="py-3 px-4">Final Clinician Level</th>
                <th className="py-3 px-4">Logged Clinical Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {overriddenAssessments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No active shift overrides recorded.
                  </td>
                </tr>
              ) : (
                overriddenAssessments.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.patientName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {item.nurseName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <TriageBadge level={item.predictedLevel} size="sm" />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({item.predictionConfidence}%)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <TriageBadge level={item.finalTriageLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-md">
                      <p className="line-clamp-2 bg-amber-50/60 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 font-medium">
                        {item.overrideReason || 'Clinical condition reassessment.'}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
