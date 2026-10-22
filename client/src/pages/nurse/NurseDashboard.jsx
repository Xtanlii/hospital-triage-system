import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  AlertOctagon, 
  ArrowRight,
  Eye,
  FileHeart,
  Plus
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { TriageBadge } from '../../components/common/TriageBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { useApp } from '../../context/AppContext';
import { PatientDetailModal } from '../../components/doctor/PatientDetailModal';

export const NurseDashboard = () => {
  const navigate = useNavigate();
  const { queue, stats, patients, assessments } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Filter active queue entries
  const activeQueue = queue.filter(item => item.status !== 'Completed' && item.status !== 'Cancelled');

  const filteredQueue = activeQueue.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (item?.patientName || '').toLowerCase().includes(q) ||
      (item?.queueNumber || '').toLowerCase().includes(q) ||
      (item?.departmentName || '').toLowerCase().includes(q) ||
      (item?.chiefComplaint || '').toLowerCase().includes(q);
    
    let matchesLevel = filterLevel === 'ALL';
    if (!matchesLevel) {
      if (item.triageLevel === filterLevel) {
        matchesLevel = true;
      } else if (filterLevel === 'LEVEL 1' && item.triageLevel === 'RED') {
        matchesLevel = true;
      } else if (filterLevel === 'LEVEL 2' && (item.triageLevel === 'ORANGE' || item.triageLevel === 'AMBER')) {
        matchesLevel = true;
      } else if (filterLevel === 'LEVEL 3' && item.triageLevel === 'AMBER') {
        matchesLevel = true;
      } else if (filterLevel === 'LEVEL 4' && item.triageLevel === 'GREEN') {
        matchesLevel = true;
      } else if (filterLevel === 'LEVEL 5' && item.triageLevel === 'BLUE') {
        matchesLevel = true;
      }
    }

    return matchesSearch && matchesLevel;
  });

  const selectedPatient = selectedEntry ? patients.find(p => p.id === selectedEntry.patientId) : null;
  const selectedAssessment = selectedEntry ? assessments.find(a => a.id === selectedEntry.assessmentId) : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileHeart className="text-clinical-600" size={24} />
            <span>Triage Station</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Emergency intake prioritization, clinical triage assessments, and live queue tracking.
          </p>
        </div>

        <button
          onClick={() => navigate('/nurse/triage/new')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>New Triage Assessment</span>
        </button>
      </div>

      {/* Spacious 3-Metric Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Active Waiting Queue"
          value={stats.waitingCount}
          subtitle="Patients triaged & awaiting doctor"
          icon={Users}
          variant="primary"
        >
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white">
              {stats.level1Count ?? stats.redCount} L1
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white">
              {stats.level2Count ?? 0} L2
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white">
              {stats.level3Count ?? stats.amberCount} L3
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white">
              {stats.level4Count ?? 0} L4
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white">
              {stats.level5Count ?? stats.greenCount} L5
            </span>
          </div>
        </StatCard>

        <StatCard
          title="Immediate Cases"
          value={stats.level1Count ?? stats.redCount}
          subtitle="Requires immediate intervention"
          icon={AlertOctagon}
          variant={(stats.level1Count ?? stats.redCount) > 0 ? 'red' : 'default'}
        >
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {(stats.level1Count ?? stats.redCount) > 0 
              ? 'High-priority cases automatically floated to top of physician queue.' 
              : 'No immediate life-threat emergency cases pending.'}
          </p>
        </StatCard>

        <StatCard
          title="Average Waiting Time"
          value={`${stats.averageWaitTime}m`}
          subtitle="Target threshold < 30 minutes"
          icon={Clock}
          variant="default"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Awaiting Triage Intake:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{stats.awaitingTriageCount} in reception</span>
          </div>
        </StatCard>
      </div>

      {/* Main Queue Table Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Priority Patient Queue
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Prioritized strictly by 5-level clinical triage urgency (L1 → L5), then waiting duration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search queue..."
              className="w-full sm:w-48"
            />

            {/* Level Filter Tabs for 5 ESI Levels */}
            <div className="flex items-center gap-0.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  filterLevel === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterLevel('LEVEL 1')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  filterLevel === 'LEVEL 1' ? 'bg-rose-600 text-white font-bold' : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                L1 ({stats.level1Count ?? stats.redCount})
              </button>
              <button
                onClick={() => setFilterLevel('LEVEL 2')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  filterLevel === 'LEVEL 2' ? 'bg-orange-500 text-white font-bold' : 'text-slate-500 hover:text-orange-500'
                }`}
              >
                L2 ({stats.level2Count ?? 0})
              </button>
              <button
                onClick={() => setFilterLevel('LEVEL 3')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  filterLevel === 'LEVEL 3' ? 'bg-amber-500 text-white font-bold' : 'text-slate-500 hover:text-amber-500'
                }`}
              >
                L3 ({stats.level3Count ?? stats.amberCount})
              </button>
              <button
                onClick={() => setFilterLevel('LEVEL 4')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  filterLevel === 'LEVEL 4' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-500 hover:text-emerald-500'
                }`}
              >
                L4 ({stats.level4Count ?? 0})
              </button>
              <button
                onClick={() => setFilterLevel('LEVEL 5')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  filterLevel === 'LEVEL 5' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-blue-500'
                }`}
              >
                L5 ({stats.level5Count ?? stats.greenCount})
              </button>
            </div>
          </div>
        </div>

        {/* Spacious Priority Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">Ticket #</th>
                <th className="py-3 px-5">Patient Name</th>
                <th className="py-3 px-5">Triage Level</th>
                <th className="py-3 px-5">Wait Duration</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No active patients in queue matching this filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const isLevel1 = item.triageLevel === 'LEVEL 1' || item.triageLevel === 'RED';
                  const isLevel2 = item.triageLevel === 'LEVEL 2';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isLevel1 ? 'bg-rose-50/25 dark:bg-rose-950/20' : isLevel2 ? 'bg-orange-50/15 dark:bg-orange-950/10' : ''
                      }`}
                    >
                      <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {item.queueNumber}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{item.patientName}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{item.chiefComplaint}</div>
                      </td>
                      <td className="py-4 px-5">
                        <TriageBadge level={item.triageLevel} size="md" pulse={isLevel1} />
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {item.waitingMinutes} min
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                        {item.departmentName}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedEntry(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-clinical-700 dark:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950/50 rounded-lg border border-clinical-200 dark:border-clinical-800 transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View Sheet</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Subtle Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500">
            Showing prioritized queue ({filteredQueue.length} patients)
          </span>
          <button
            onClick={() => navigate('/nurse/queue')}
            className="font-bold text-clinical-600 dark:text-clinical-400 hover:text-clinical-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Full Queue Manager</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedEntry && (
        <PatientDetailModal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          queueEntry={selectedEntry}
          patient={selectedPatient}
          assessment={selectedAssessment}
        />
      )}
    </div>
  );
};
