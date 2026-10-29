import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Clock, 
  Activity, 
  Bot, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Stethoscope
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { 
  TriageDistributionDonut, 
  DepartmentWaitBarChart 
} from '../../components/admin/AnalyticsCharts';
import { analyticsService } from '../../services/analyticsService';
import { useApp } from '../../context/AppContext';
import { formatWaitTime } from '../../utils/formatWaitTime';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { departments, users, assessments, activities, stats } = useApp();

  const totalNurses = users.filter(u => u.role === 'Nurse').length;
  const totalDoctors = users.filter(u => u.role === 'Doctor').length;
  const activeDepartments = departments.filter(d => d.status === 'Active').length;

  const triageDonutData = analyticsService.getTriageDistribution(assessments);
  const departmentWaitData = analyticsService.getDepartmentWaitChartData(departments);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hospital Operations Oversight
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time throughput metrics, clinical staffing allocations, and triage governance.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/analytics')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <span>Open Full Analytics</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4 Clean Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Intake Today"
          value={stats.seenToday + stats.totalActive}
          subtitle="Hospital intake registry"
          icon={Activity}
          variant="primary"
        />
        <StatCard
          title="Currently Waiting"
          value={stats.waitingCount}
          subtitle="Awaiting physician consultation"
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Active Clinical Units"
          value={activeDepartments}
          subtitle={`${departments.length} registered departments`}
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Hospital Avg Wait"
          value={formatWaitTime(stats.averageWaitTime)}
          subtitle="Target threshold &lt; 30 min"
          icon={TrendingUp}
          variant={stats.averageWaitTime > 30 ? 'amber' : 'green'}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage Distribution Donut */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Triage Distribution
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Today
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proportion of patients across all five ESI triage levels.
            </p>
          </div>

          <div className="py-3">
            <TriageDistributionDonut data={triageDonutData} />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
              <span className="text-slate-500 dark:text-slate-400">Immediate:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{stats.level1Count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
              <span className="text-slate-500 dark:text-slate-400">Emergent:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{stats.level2Count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span className="text-slate-500 dark:text-slate-400">Urgent:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{stats.level3Count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span className="text-slate-500 dark:text-slate-400">Less Urgent:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{stats.level4Count}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
              <span className="text-slate-500 dark:text-slate-400">Non-urgent:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{stats.level5Count}</span>
            </div>
          </div>
        </div>

        {/* Department Wait Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Average Waiting Time by Department
              </h3>
              <button
                onClick={() => navigate('/admin/departments')}
                className="text-xs font-bold text-clinical-600 hover:text-clinical-700 inline-flex items-center gap-1"
              >
                <span>Manage Units</span>
                <ArrowRight size={12} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Mean wait duration in minutes across active specialty departments.
            </p>
          </div>

          <div className="py-3">
            <DepartmentWaitBarChart data={departmentWaitData} />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Staff Deployment:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalDoctors} Doctors • {totalNurses} Nurses on Duty</span>
          </div>
        </div>
      </div>

      {/* Clean System Activity & Quick Audit */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Clinical Activity Log
            </h3>
            <p className="text-xs text-slate-400">
              Latest intake, triage classifications, and physician consultations.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/activity')}
            className="text-xs font-bold text-clinical-600 hover:text-clinical-700 inline-flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activities.slice(0, 4).map(act => (
            <div key={act.id} className="py-3.5 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {act.message}
                </p>
                <span className="text-[11px] text-slate-400 font-mono">
                  {act.timestamp}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                {act.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
