import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { TriageBadge } from "../../components/common/TriageBadge";
import { SearchBar } from "../../components/common/SearchBar";
import { PatientDetailModal } from "../../components/doctor/PatientDetailModal";
import { CheckCircle2, Eye } from "lucide-react";
import { formatWaitTime } from "../../utils/formatWaitTime";

export const DoctorCompletedPage = () => {
  const { queue, patients, assessments } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  const completedList = queue.filter((item) => item.status === "Completed");

  const filtered = completedList.filter((item) => {
    const q = searchQuery.toLowerCase();

    return (
      item.patientName?.toLowerCase().includes(q) ||
      item.queueNumber?.toLowerCase().includes(q) ||
      item.departmentName?.toLowerCase().includes(q)
    );
  });

  const matchedPatient = selectedEntry
    ? (patients.find((p) => p.id === selectedEntry.patientId) || selectedEntry.patient || {
        name: selectedEntry.patientName,
        age: selectedEntry.patientAge || 35,
        gender: selectedEntry.patientGender || 'Unknown',
        id: selectedEntry.patientId
      })
    : null;

  const matchedAssessment = selectedEntry
    ? (assessments.find((a) => a.id === selectedEntry.assessmentId) || selectedEntry.assessment || {
        chiefComplaint: selectedEntry.chiefComplaint,
        finalTriageLevel: selectedEntry.triageLevel,
        predictedLevel: selectedEntry.triageLevel,
        department: selectedEntry.departmentName,
        nurseName: selectedEntry.nurseName
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckCircle2
              className="text-emerald-600 dark:text-emerald-400"
              size={22}
            />
            <span>Completed Clinical Consultations</span>
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Encounters concluded today across clinical stations and emergency
            bays.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Discharged / Seen Today:{" "}
          <strong className="text-slate-900 dark:text-white">
            {completedList.length}
          </strong>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          placeholder="Filter completed encounters by patient name or queue #..."
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Queue #</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Initial Triage</th>
                <th className="py-3 px-4">Total Wait Time</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4 text-right">Review</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    No completed consultations found for this shift.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {item.queueNumber}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.patientName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.patientAge}y • {item.patientGender}
                    </td>

                    <td className="py-3.5 px-4">
                      <TriageBadge level={item.triageLevel} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {formatWaitTime(item.waitingMinutes)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {item.departmentName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {item.assignedDoctor || "Dr. Folake Adeleke"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntry(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-clinical-700 dark:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950/50 rounded-lg border border-clinical-200 dark:border-clinical-800 transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Summary</span>
                      </button>
                    </td>
                  </tr>
                ))
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
          patient={matchedPatient}
          assessment={matchedAssessment}
        />
      )}
    </div>
  );
};
