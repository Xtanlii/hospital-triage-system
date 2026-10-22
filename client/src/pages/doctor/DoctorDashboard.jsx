import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Users, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  BellRing, 
  Eye, 
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Building2,
  Activity
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { TriageBadge } from '../../components/common/TriageBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { PatientDetailModal } from '../../components/doctor/PatientDetailModal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { 
    queue, 
    stats, 
    patients, 
    assessments, 
    callPatient, 
    markPatientSeen, 
    activeDoctorsCount, 
    toggleDoctorDutyStatus 
  } = useApp();
  const { currentUser, updateCurrentUser } = useAuth();

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentScope, setDepartmentScope] = useState('MY_DEPT'); // 'MY_DEPT' | 'ALL'

  const isOnDuty = currentUser?.isOnDuty !== false;

  const handleToggleDuty = async () => {
    const optimisticNext = !isOnDuty;
    updateCurrentUser({ isOnDuty: optimisticNext });
    const nextStatus = await toggleDoctorDutyStatus(currentUser?.id);
    if (typeof nextStatus === 'boolean' && nextStatus !== optimisticNext) {
      updateCurrentUser({ isOnDuty: nextStatus });
    }
  };

  // Active incoming queue for doctor's assigned department only
  const incomingPatients = queue.filter(item => item.status !== 'Completed' && item.status !== 'Cancelled');

  const doctorDeptId = currentUser?.departmentId || 'dept-er';
  const doctorDeptName = currentUser?.departmentName || 'Emergency Medicine';

  // Strictly scoped to doctor's own department
  const myDeptPatients = incomingPatients.filter(item => item.departmentId === doctorDeptId);
  const scopedIncoming = myDeptPatients;

  const filteredIncoming = scopedIncoming.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item?.patientName || '').toLowerCase().includes(q) ||
      (item?.queueNumber || '').toLowerCase().includes(q) ||
      (item?.departmentName || '').toLowerCase().includes(q) ||
      (item?.chiefComplaint || '').toLowerCase().includes(q)
    );
  });

  const selectedPatient = selectedEntry ? patients.find(p => p.id === selectedEntry.patientId) : null;
  const selectedAssessment = selectedEntry ? assessments.find(a => a.id === selectedEntry.assessmentId) : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header with Shift Status & Active Counter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Stethoscope className="text-clinical-600" size={24} />
              <span>Physician Station</span>
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {doctorDeptName}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritized incoming clinical queue, triage decision audits, and consultation management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Doctors Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <Activity size={14} className="text-clinical-600" />
            <span>Active Doctors on Duty:</span>
            <strong className="text-slate-900 dark:text-white font-mono">{activeDoctorsCount}</strong>
          </div>

          {/* On Duty / Off Duty Toggle */}
          <button
            type="button"
            onClick={handleToggleDuty}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              isOnDuty
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle your clinical shift duty status"
          >
            <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isOnDuty ? 'Shift: On Duty' : 'Shift: Off Duty'}</span>
            {isOnDuty ? <ToggleRight size={18} className="text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft size={18} className="text-slate-400" />}
          </button>

          <button
            onClick={() => navigate('/doctor/incoming')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Priority Stream View</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Spacious 3-Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Awaiting Physician"
          value={stats.waitingCount}
          subtitle="Patients triaged & waiting for consult"
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
          title="Immediate Cases (Red)"
          value={(stats.level1Count ?? stats.redCount)}
          subtitle="Immediate clinical intervention required"
          icon={AlertOctagon}
          variant={(stats.level1Count ?? stats.redCount) > 0 ? 'red' : 'default'}
        >
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {(stats.level1Count ?? stats.redCount) > 0 
              ? 'Critical hemodynamics. Review chief complaint and vital signs immediately.' 
              : 'No pending Immediate cases in current stream.'}
          </p>
        </StatCard>

        <StatCard
          title="Encounters Completed"
          value={stats.seenToday}
          subtitle="Patients consulted & discharged today"
          icon={CheckCircle2}
          variant="green"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Average Hospital Wait:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{stats.averageWaitTime} mins</span>
          </div>
        </StatCard>
      </div>

      {/* Priority Incoming Queue Table with Department Scoping */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Incoming Patients by Urgency
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-clinical-50 dark:bg-clinical-950/60 text-clinical-700 dark:text-clinical-300 border border-clinical-200 dark:border-clinical-800 text-xs font-bold ml-2">
                <Building2 size={13} />
                <span>{doctorDeptName} ({myDeptPatients.length})</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Showing incoming patients routed to your department ({doctorDeptName}).
            </p>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search name, ticket, complaint..."
            className="w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">Priority & Ticket</th>
                <th className="py-3 px-5">Patient Details</th>
                <th className="py-3 px-5">Triage Urgency</th>
                <th className="py-3 px-5">Wait Duration</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIncoming.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No incoming patients found in this stream.
                  </td>
                </tr>
              ) : (
                filteredIncoming.map((item, index) => {
                  const isLevel1 = item.triageLevel === 'LEVEL 1' || item.triageLevel === 'RED';
                  const isLevel2 = item.triageLevel === 'LEVEL 2';
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isLevel1 
                          ? 'bg-rose-50/30 dark:bg-rose-950/20' 
                          : isLevel2 
                            ? 'bg-orange-50/20 dark:bg-orange-950/10' 
                            : ''
                      }`}
                    >
                      <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] flex items-center justify-center font-sans font-bold">
                          {index + 1}
                        </span>
                        <span>{item.queueNumber}</span>
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
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'Waiting' && (
                            <button
                              onClick={() => callPatient(item.id, currentUser?.name)}
                              className="px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <BellRing size={12} />
                              <span>Call</span>
                            </button>
                          )}
                          {item.status === 'Called' && (
                            <button
                              onClick={() => markPatientSeen(item.id, currentUser?.name)}
                              className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={12} />
                              <span>Mark Seen</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedEntry(item)}
                            className="px-3 py-1.5 text-xs font-semibold text-clinical-700 dark:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950/50 border border-clinical-200 dark:border-clinical-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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

      {/* Patient Detail Encounter Modal */}
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