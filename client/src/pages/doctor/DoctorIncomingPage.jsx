import React, { useState } from 'react';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  Eye, 
  BellRing, 
  CheckCircle2, 
  AlertOctagon,
  Clock,
  Building2,
  Activity,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { TriageBadge } from '../../components/common/TriageBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { SelectInput } from '../../components/common/SelectInput';
import { PatientDetailModal } from '../../components/doctor/PatientDetailModal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatWaitTime } from '../../utils/formatWaitTime';

export const DoctorIncomingPage = () => {
  const { 
    queue, 
    departments, 
    patients, 
    assessments, 
    callPatient, 
    markPatientSeen, 
    activeDoctorsCount,
    toggleDoctorDutyStatus
  } = useApp();
  const { currentUser, updateCurrentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  // Doctor's assigned department - locked scoping
  const doctorDeptId = currentUser?.departmentId || 'dept-er';
  const doctorDeptName = currentUser?.departmentName || 'Emergency Medicine';
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const isOnDuty = currentUser?.isOnDuty !== false;

  const handleToggleDuty = async () => {
    const optimisticNext = !isOnDuty;
    updateCurrentUser({ isOnDuty: optimisticNext });
    const nextStatus = await toggleDoctorDutyStatus(currentUser?.id);
    if (typeof nextStatus === 'boolean' && nextStatus !== optimisticNext) {
      updateCurrentUser({ isOnDuty: nextStatus });
    }
  };

  // Incoming active queue only
  const activeEntries = queue.filter(item => item.status !== 'Completed' && item.status !== 'Cancelled');

  const filtered = activeEntries.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (item?.patientName || '').toLowerCase().includes(q) ||
      (item?.queueNumber || '').toLowerCase().includes(q) ||
      (item?.chiefComplaint || '').toLowerCase().includes(q);

    // Strictly scoped to doctor's own department
    const matchesDept = item.departmentId === doctorDeptId;
    
    // Support matching both 5-level and legacy 3-color codes
    let matchesLevel = selectedLevel === 'ALL';
    if (!matchesLevel) {
      if (selectedLevel === item.triageLevel) {
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

    return matchesSearch && matchesDept && matchesLevel;
  });

  const selectedPatient = selectedEntry ? patients.find(p => p.id === selectedEntry.patientId) : null;
  const selectedAssessment = selectedEntry ? assessments.find(a => a.id === selectedEntry.assessmentId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Stethoscope className="text-clinical-600" size={20} />
            <span>Incoming Patients Priority Queue</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time urgency sorted stream. Immediate (Level 1) cases are surfaced at the top.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Doctors Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <Activity size={13} className="text-clinical-600" />
            <span>Active Doctors: <strong className="text-slate-900 dark:text-white font-mono">{activeDoctorsCount}</strong></span>
          </div>

          {/* On Duty / Off Duty Toggle */}
          <button
            type="button"
            onClick={handleToggleDuty}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              isOnDuty
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isOnDuty ? 'On Duty' : 'Off Duty'}</span>
            {isOnDuty ? <ToggleRight size={16} className="text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft size={16} className="text-slate-400" />}
          </button>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Awaiting Physician: <strong className="text-slate-900 dark:text-white">{filtered.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Filter by patient name, complaint, or queue ticket..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-clinical-50 dark:bg-clinical-950/60 border border-clinical-200 dark:border-clinical-800 text-clinical-700 dark:text-clinical-300 text-xs font-bold shrink-0">
            <Building2 size={13} />
            <span>{doctorDeptName}</span>
          </div>

          <SelectInput
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full sm:w-48"
            options={[
              { value: 'ALL', label: 'All Urgency Levels' },
              { value: 'LEVEL 1', label: 'Immediate (Red)' },
              { value: 'LEVEL 2', label: 'Emergent (Orange)' },
              { value: 'LEVEL 3', label: 'Urgent (Yellow)' },
              { value: 'LEVEL 4', label: 'Less Urgent (Blue)' },
              { value: 'LEVEL 5', label: 'Non-Urgent (Blue)' }
            ]}
          />
        </div>
      </div>

      {/* Incoming Patient Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Priority #</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Triage Urgency</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching incoming patients.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isLevel1 = item.triageLevel === 'LEVEL 1' || item.triageLevel === 'RED';
                  const isLevel2 = item.triageLevel === 'LEVEL 2';
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isLevel1 ? 'bg-rose-50/30 dark:bg-rose-950/20' : isLevel2 ? 'bg-orange-50/20 dark:bg-orange-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] flex items-center justify-center font-sans font-bold">
                            {idx + 1}
                          </span>
                          <span>{item.queueNumber}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.patientName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{item.chiefComplaint}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {item.patientAge}y • {item.patientGender}
                      </td>
                      <td className="py-3.5 px-4">
                        <TriageBadge level={item.triageLevel} size="sm" pulse={isLevel1} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {formatWaitTime(item.waitingMinutes)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.departmentName}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => callPatient(item.id, currentUser?.name)}
                            title="Call patient"
                            className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                          >
                            <BellRing size={13} />
                          </button>
                          <button
                            onClick={() => markPatientSeen(item.id, currentUser?.name)}
                            title="Mark encounter as completed"
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                          <button
                            onClick={() => setSelectedEntry(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-clinical-700 dark:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950/40 rounded-lg border border-clinical-200 dark:border-clinical-800 transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Encounter</span>
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

