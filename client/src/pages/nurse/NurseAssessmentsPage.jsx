import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TriageBadge } from '../../components/common/TriageBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { PatientDetailModal } from '../../components/doctor/PatientDetailModal';
import { Eye, ShieldCheck, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';

export const NurseAssessmentsPage = () => {
  const { assessments, patients, queue } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const filteredAssessments = assessments.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (a?.patientName || '').toLowerCase().includes(q) ||
      (a?.chiefComplaint || '').toLowerCase().includes(q) ||
      (a?.nurseName || '').toLowerCase().includes(q);

    let matchesLevel = levelFilter === 'ALL';
    if (!matchesLevel) {
      const finalLvl = String(a.finalTriageLevel || '').toUpperCase();
      if (finalLvl === levelFilter) {
        matchesLevel = true;
      } else if (levelFilter === 'LEVEL 1' && (finalLvl === 'RED' || finalLvl === 'CRITICAL')) {
        matchesLevel = true;
      } else if (levelFilter === 'LEVEL 2' && finalLvl === 'ORANGE') {
        matchesLevel = true;
      } else if (levelFilter === 'LEVEL 3' && (finalLvl === 'AMBER' || finalLvl === 'YELLOW')) {
        matchesLevel = true;
      } else if (levelFilter === 'LEVEL 4' && finalLvl === 'GREEN') {
        matchesLevel = true;
      } else if (levelFilter === 'LEVEL 5' && finalLvl === 'BLUE') {
        matchesLevel = true;
      }
    }
    return matchesSearch && matchesLevel;
  });

  const matchedPatient = selectedAssessment ? patients.find(p => p.id === selectedAssessment.patientId) : null;
  const matchedQueue = selectedAssessment ? queue.find(q => q.assessmentId === selectedAssessment.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="text-clinical-600" size={20} />
            <span>Completed Triage Assessments Log</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of all triage decisions, AI model predictions, and clinician override rationales.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Total Recorded: <strong className="text-slate-900 dark:text-white">{assessments.length}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search by patient name, complaint, or nurse..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
          >
            <option value="ALL">All Urgency Levels</option>
            <option value="LEVEL 1">Immediate (Red)</option>
            <option value="LEVEL 2">Emergent (Orange)</option>
            <option value="LEVEL 3">Urgent (Yellow)</option>
            <option value="LEVEL 4">Less Urgent (Green)</option>
            <option value="LEVEL 5">Non-Urgent (Blue)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Assessing Nurse</th>
                <th className="py-3 px-4">AI Prediction</th>
                <th className="py-3 px-4">Final Triage Level</th>
                <th className="py-3 px-4">Override Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No assessment records found.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.patientName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{item.chiefComplaint}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {item.nurseName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <TriageBadge level={item.predictedLevel || 'GREEN'} size="sm" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">({item.predictionConfidence}%)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <TriageBadge level={item.finalTriageLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      {item.override ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          <AlertTriangle size={12} />
                          Overridden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 size={12} />
                          Confirmed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedAssessment(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-clinical-700 dark:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950/50 rounded-lg border border-clinical-200 dark:border-clinical-800 transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAssessment && (
        <PatientDetailModal
          isOpen={!!selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          assessment={selectedAssessment}
          patient={matchedPatient}
          queueEntry={matchedQueue}
        />
      )}
    </div>
  );
};
