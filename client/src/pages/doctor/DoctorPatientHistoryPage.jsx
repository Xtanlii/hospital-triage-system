import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchBar } from '../../components/common/SearchBar';
import { PatientDetailModal } from '../../components/doctor/PatientDetailModal';
import { FileText, Eye } from 'lucide-react';

export const DoctorPatientHistoryPage = () => {
  const { patients, assessments, queue } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.hospitalId.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    );
  });

  const matchedAssessment = selectedPatient 
    ? assessments.find(a => a.patientId === selectedPatient.id) 
    : null;

  const matchedQueue = selectedPatient 
    ? queue.find(q => q.patientId === selectedPatient.id) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="text-clinical-600" size={20} />
            <span>Patient Medical Records & Triage History</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Archival repository of hospital patients, clinical histories, allergies, and prior triage encounters.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Enrolled Profiles: <strong className="text-slate-900 dark:text-white">{patients.length}</strong>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search by patient full name or phone number..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(patient => {
          const patientAssessments = assessments.filter(a => a.patientId === patient.id);
          const latestAssessment = patientAssessments[0];

          return (
            <div 
              key={patient.id} 
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-clinical-100 dark:bg-clinical-950/60 text-clinical-800 dark:text-clinical-400 font-bold flex items-center justify-center text-sm border border-clinical-200 dark:border-clinical-800">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{patient.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{patient.age} yrs • {patient.gender}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {patient.bloodGroup || 'O+'} / {patient.genotype || 'AA'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Demographics</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{patient.age} yrs • {patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Last Visit</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{patient.lastVisit || 'Recent'}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Allergies & Alerts</span>
                  <p className="text-rose-700 dark:text-rose-400 font-semibold truncate">
                    {patient.allergies?.join(', ') || 'No known allergies'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {patientAssessments.length} triage records
                </span>
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-clinical-700 dark:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950/50 rounded-lg border border-clinical-200 dark:border-clinical-800 transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  <span>View Clinical File</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPatient && (
        <PatientDetailModal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          patient={selectedPatient}
          assessment={matchedAssessment}
          queueEntry={matchedQueue}
        />
      )}
    </div>
  );
};