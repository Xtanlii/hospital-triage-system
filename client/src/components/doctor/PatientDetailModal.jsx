import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { TriageBadge } from '../common/TriageBadge';
import { StatusBadge } from '../common/StatusBadge';
import { SelectInput } from '../common/SelectInput';
import { 
  Heart, 
  Thermometer, 
  Wind, 
  Activity, 
  User, 
  AlertCircle, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  BellRing, 
  Stethoscope, 
  FileText,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatWaitTime } from '../../utils/formatWaitTime';

export const PatientDetailModal = ({
  isOpen,
  onClose,
  queueEntry,
  patient,
  assessment,
  history = []
}) => {
  const { callPatient, markPatientSeen, updateQueueStatus } = useApp();
  const { currentUser } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(queueEntry?.status || 'Waiting');

  if (!queueEntry && !patient && !assessment) return null;

  const currentPatient = patient || assessment?.patient || {
    name: assessment?.patientName || queueEntry?.patientName || 'Patient',
    age: assessment?.patientAge || queueEntry?.patientAge || 35,
    gender: assessment?.patientGender || queueEntry?.patientGender || 'Unknown',
    id: assessment?.patientId || queueEntry?.patientId
  };

  const vitals = assessment?.vitals || {
    temperature: assessment?.temperature || '37.0',
    bloodPressure: (assessment?.systolic_bp && assessment?.diastolic_bp) 
      ? `${assessment.systolic_bp}/${assessment.diastolic_bp}` 
      : (assessment?.bloodPressure || '120/80'),
    heartRate: assessment?.heart_rate || assessment?.heartRate || '75',
    respiratoryRate: assessment?.respiratory_rate || assessment?.respiratoryRate || '16',
    oxygenSaturation: assessment?.spo2 || assessment?.oxygenSaturation || '98',
    weight: assessment?.weight || '70',
    height: assessment?.height || '175'
  };

  const handleCall = () => {
    if (queueEntry) {
      callPatient(queueEntry.id, currentUser?.name);
    }
  };

  const handleMarkSeen = () => {
    if (queueEntry) {
      markPatientSeen(queueEntry.id, currentUser?.name);
      onClose();
    }
  };

  const handleStatusChange = (e) => {
    const newStat = e.target.value;
    setSelectedStatus(newStat);
    if (queueEntry) {
      updateQueueStatus(queueEntry.id, newStat, currentUser?.name);
    }
  };

  // Quick vital sign normality checks
  const isSpo2Low = parseFloat(vitals.oxygenSaturation) < 92;
  const isHrHigh = parseFloat(vitals.heartRate) > 105;
  const isTempHigh = parseFloat(vitals.temperature) >= 38.0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Clinical Patient Encounter: {currentPatient?.name || patient?.name || queueEntry?.patientName}</span>
          {queueEntry?.queueNumber && (
            <span className="text-xs px-2 py-0.5 rounded bg-clinical-100 text-clinical-800 font-mono font-bold">
              #{queueEntry.queueNumber}
            </span>
          )}
        </div>
      }
      subtitle={`Department: ${queueEntry?.departmentName || assessment?.department || 'Outpatient'} • Urgency: ${assessment?.finalTriageLevel || queueEntry?.triageLevel || 'Urgent'}`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          {queueEntry ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Update Queue Status:</span>
              <SelectInput
                value={queueEntry?.status || selectedStatus}
                onChange={handleStatusChange}
                className="w-40"
                options={[
                  { value: 'Waiting', label: 'Waiting' },
                  { value: 'Called', label: 'Called' },
                  { value: 'In Consultation', label: 'In Consultation' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' }
                ]}
              />
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
              Completed Triage Assessment Record
            </span>
          )}

          <div className="flex items-center gap-2">
            {queueEntry && queueEntry?.status !== 'Completed' && (
              <>
                <button
                  type="button"
                  onClick={handleCall}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  <BellRing size={13} />
                  <span>Call Patient</span>
                </button>
                <button
                  type="button"
                  onClick={handleMarkSeen}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Mark as Seen</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Triage & Status Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Active Triage Urgency
            </span>
            <div className="flex items-center gap-3">
              <TriageBadge level={queueEntry?.triageLevel || assessment?.finalTriageLevel || 'LEVEL 4'} size="lg" />
              {queueEntry?.status && <StatusBadge status={queueEntry.status} />}
            </div>
          </div>

          <div className="text-right space-y-1 text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Assessing Nurse:</span> {assessment?.nurseName || 'Nurse Amina Bello'}
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Checked In:</span> {queueEntry?.waitingMinutes !== undefined ? `${formatWaitTime(queueEntry.waitingMinutes)} ago` : 'Recent'}
            </div>
          </div>
        </div>

        {/* AI Prediction vs Clinician Final Decision Analysis */}
        {assessment && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ShieldCheck size={16} className="text-clinical-600" />
              <span>Triage Assessment & Decision Support Audit</span>
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">AI Recommendation</span>
                <div className="mt-1 flex items-center gap-2">
                  <TriageBadge level={assessment.predictedLevel || 'LEVEL 4'} size="sm" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">({assessment.predictionConfidence || 90}%)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Final Nurse Decision</span>
                <div className="mt-1">
                  <TriageBadge level={assessment.finalTriageLevel} size="sm" />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Override Status</span>
                <div className="mt-1 text-xs font-bold">
                  {assessment.override ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                      <AlertTriangle size={13} />
                      Overridden by Clinician
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={13} />
                      Clinician Confirmed AI
                    </span>
                  )}
                </div>
              </div>
            </div>

            {assessment.override && assessment.overrideReason && (
              <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold block">Documented Override Rationale:</span>
                <p className="leading-relaxed">{assessment.overrideReason}</p>
              </div>
            )}
          </div>
        )}

        {/* Vital Signs Grid */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity size={15} className="text-clinical-600" />
            <span>Recorded Vital Signs</span>
          </h5>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Blood Pressure */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Blood Pressure</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {vitals.bloodPressure || '120/80'}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">mmHg</span>
            </div>

            {/* Heart Rate */}
            <div className={`p-3 rounded-xl border ${isHrHigh ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Heart Rate</span>
              <div className={`text-base font-bold mt-0.5 ${isHrHigh ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {vitals.heartRate || '78'}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">bpm {isHrHigh && '(Elevated)'}</span>
            </div>

            {/* Oxygen Saturation */}
            <div className={`p-3 rounded-xl border ${isSpo2Low ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">SpO2 (Pulse Oximetry)</span>
              <div className={`text-base font-bold mt-0.5 ${isSpo2Low ? 'text-rose-700 dark:text-rose-400 font-black' : 'text-slate-900 dark:text-white'}`}>
                {vitals.oxygenSaturation || '98'}%
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{isSpo2Low ? 'Hypoxemic Alert' : 'Normal'}</span>
            </div>

            {/* Temperature */}
            <div className={`p-3 rounded-xl border ${isTempHigh ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Body Temp</span>
              <div className={`text-base font-bold mt-0.5 ${isTempHigh ? 'text-amber-800 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {vitals.temperature || '36.8'}°C
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{isTempHigh ? 'Pyrexic' : 'Normal'}</span>
            </div>

            {/* Respiratory Rate */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Resp. Rate</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {vitals.respiratoryRate || '18'}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">breaths/min</span>
            </div>
          </div>
        </div>

        {/* Symptoms & Chief Complaint */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileText size={15} className="text-clinical-600" />
            <span>Chief Complaint & Clinical Presentation</span>
          </h5>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Primary Complaint: </span>
              <span className="text-slate-900 dark:text-white font-semibold">{assessment?.chiefComplaint || queueEntry?.chiefComplaint || 'Routine medical review'}</span>
            </div>
            {assessment?.symptoms && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Associated Symptoms: </span>
                <span className="text-slate-700 dark:text-slate-300">{assessment.symptoms}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-4 pt-1 text-slate-500 dark:text-slate-400">
              {assessment?.symptomDuration && (
                <div><span className="font-medium">Duration:</span> {assessment.symptomDuration}</div>
              )}
              {assessment?.painLevel !== undefined && (
                <div><span className="font-medium">Reported Pain Score:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{assessment.painLevel}/10</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Demographics & Medical History */}
        {currentPatient && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User size={15} className="text-clinical-600" />
              <span>Patient Profile & History</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Age & Gender</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPatient.age || 35} yrs • {currentPatient.gender || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Blood / Genotype</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPatient.bloodGroup || 'O+'} / {currentPatient.genotype || 'AA'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Phone Contact</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPatient.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Last Hospital Visit</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPatient.lastVisit || 'First visit'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Existing Conditions</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                  {currentPatient.existingConditions?.join?.(', ') || currentPatient.existingConditions || 'None recorded'}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-500 block">Documented Allergies</span>
                <p className="text-rose-700 dark:text-rose-400 font-bold mt-0.5">
                  {currentPatient.allergies?.join?.(', ') || currentPatient.allergies || 'None known'}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Current Medications</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                  {currentPatient.currentMedications?.join?.(', ') || currentPatient.currentMedications || 'None'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

