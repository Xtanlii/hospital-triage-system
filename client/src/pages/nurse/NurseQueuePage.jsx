import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  BellRing, 
  ArrowUpDown,
  CheckCircle2,
  FileHeart,
  RotateCw
} from 'lucide-react';
import { TriageBadge } from '../../components/common/TriageBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PatientDetailModal } from '../../components/doctor/PatientDetailModal';

export const NurseQueuePage = () => {
  const { queue, departments, patients, assessments, callPatient, updateQueueStatus } = useApp();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Filter queue
  const filteredQueue = queue.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (item?.patientName || '').toLowerCase().includes(q) ||
      (item?.queueNumber || '').toLowerCase().includes(q) ||
      (item?.patientId || '').toLowerCase().includes(q) ||
      (item?.chiefComplaint || '').toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || item.departmentId === selectedDept;
    
    let matchesLevel = selectedLevel === 'ALL';
    if (!matchesLevel) {
      if (item.triageLevel === selectedLevel) {
        matchesLevel = true;
      } else if (selectedLevel === 'LEVEL 1' && item.triageLevel === 'RED') {
        matchesLevel = true;
      } else if (selectedLevel === 'LEVEL 2' && (item.triageLevel === 'ORANGE' || item.triageLevel === 'AMBER')) {
        matchesLevel = true;
      } else if (selectedLevel === 'LEVEL 3' && item.triageLevel === 'AMBER') {
        matchesLevel = true;
      } else if (selectedLevel === 'LEVEL 4' && item.triageLevel === 'GREEN') {
        matchesLevel = true;
      } else if (selectedLevel === 'LEVEL 5' && item.triageLevel === 'BLUE') {
        matchesLevel = true;
      }
    }

    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

    return matchesSearch && matchesDept && matchesLevel && matchesStatus;
  });

  const selectedPatient = selectedEntry ? patients.find(p => p.id === selectedEntry.patientId) : null;
  const selectedAssessment = selectedEntry ? assessments.find(a => a.id === selectedEntry.assessmentId) : null;

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="text-clinical-600" size={20} />
            <span>Hospital Patient Queue Registry</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized queue monitoring across all departments with 5-level clinical priority ordering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            Total Active: <strong className="text-slate-900 dark:text-white">{queue.filter(q => q.status !== 'Completed').length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search patient, ID, or queue #..."
          />

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          {/* Triage Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
          >
            <option value="ALL">All Urgency Levels</option>
            <option value="LEVEL 1">Immediate (Red)</option>
            <option value="LEVEL 2">Emergent (Orange)</option>
            <option value="LEVEL 3">Urgent (Yellow)</option>
            <option value="LEVEL 4">Less Urgent (Green)</option>
            <option value="LEVEL 5">Non-Urgent (Blue)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
          >
            <option value="ALL">All Queue Statuses</option>
            <option value="Waiting">Waiting</option>
            <option value="Called">Called</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Full Queue Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Queue #</th>
                <th className="py-3.5 px-4">Patient Information</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Triage Priority</th>
                <th className="py-3.5 px-4">Wait Time</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No patient queue records match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item, idx) => {
                  const isLevel1 = item.triageLevel === 'LEVEL 1' || item.triageLevel === 'RED';
                  const isLevel2 = item.triageLevel === 'LEVEL 2';
                  return (
                    <tr 
                      key={item.id || item.queue_id || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isLevel1 && item.status !== 'Completed' 
                          ? 'bg-rose-50/20 dark:bg-rose-950/20' 
                          : isLevel2 && item.status !== 'Completed' 
                            ? 'bg-orange-50/15 dark:bg-orange-950/10' 
                            : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {item.queueNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.patientName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm">
                          {item.chiefComplaint}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {item.patientAge}y • {item.patientGender}
                      </td>
                      <td className="py-3.5 px-4">
                        <TriageBadge level={item.triageLevel} size="sm" pulse={isLevel1 && item.status !== 'Completed'} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {item.waitingMinutes} min
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.departmentName}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'Waiting' && (
                            <button
                              onClick={() => callPatient(item.id, currentUser?.name)}
                              title="Call patient"
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                            >
                              <BellRing size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedEntry(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-clinical-700 dark:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950/40 rounded-lg border border-clinical-200 dark:border-clinical-800 transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

