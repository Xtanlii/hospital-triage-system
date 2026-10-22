import React from 'react';
import { 
  TriageDistributionDonut, 
  DepartmentWaitBarChart, 
  PatientFlowLineChart 
} from '../../components/admin/AnalyticsCharts';
import { analyticsService } from '../../services/analyticsService';
import { useApp } from '../../context/AppContext';
import { Activity, Clock, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';

export const QueueAnalyticsPage = () => {
  const { assessments, departments, stats } = useApp();

  const donutData = analyticsService.getTriageDistribution(assessments);
  const barData = analyticsService.getDepartmentWaitChartData(departments);
  const lineData = analyticsService.getHourlyFlowData();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Activity className="text-clinical-600" size={20} />
          <span>Queue & Clinical Throughput Analytics</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Comprehensive data visualization of hospital patient flow, specialty waiting times, and triage distribution.
        </p>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Average Wait"
          value={`${stats.averageWaitTime} mins`}
          subtitle="Hospital-wide median"
          icon={Clock}
          variant="primary"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Target threshold &lt; 30 min</div>
        </StatCard>
        <StatCard
          title="Consultations Today"
          value={stats.seenToday}
          subtitle="Physician completed"
          icon={Activity}
          variant="green"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Across all active clinics</div>
        </StatCard>
        <StatCard
          title="Active in Queue"
          value={stats.waitingCount}
          subtitle="Awaiting physician"
          icon={Users}
          variant="default"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Patients in holding stream</div>
        </StatCard>
        <StatCard
          title="Critical Immediate Load"
          value={stats.level1Count ?? stats.redCount}
          subtitle="Immediate triage priority"
          icon={TrendingUp}
          variant="red"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Requires instant intervention</div>
        </StatCard>
      </div>

      {/* Hourly Flow Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hourly Patient Flow: Intake Arrivals vs. Completed Consultations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracks surge volumes across operational shift hours (08:00 - 17:00).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-fit">
            Peak Hours: 11:00 AM & 15:00 PM
          </span>
        </div>

        <div className="pt-2">
          <PatientFlowLineChart data={lineData} />
        </div>
      </div>

      {/* Row with Triage Distribution and Department Wait Times */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Triage Urgency Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown across all five clinical priority categories.
            </p>
          </div>
          <TriageDistributionDonut data={donutData} />
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Average Waiting Time by Clinical Department (Minutes)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparison across active hospital specialty units.
            </p>
          </div>
          <DepartmentWaitBarChart data={barData} />
        </div>
      </div>
    </div>
  );
};