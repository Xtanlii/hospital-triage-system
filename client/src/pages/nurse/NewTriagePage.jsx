import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileHeart, 
  UserPlus, 
  User, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { FormInput } from '../../components/common/FormInput';
import { SelectInput } from '../../components/common/SelectInput';
import { TriageBadge } from '../../components/common/TriageBadge';
import { TriagePredictorCard } from '../../components/nurse/TriagePredictorCard';
import { NurseOverridePanel } from '../../components/nurse/NurseOverridePanel';
import { Modal } from '../../components/common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { triageService } from '../../services/triageService';
import { formatWaitTime } from '../../utils/formatWaitTime';

export const NewTriagePage = () => {
  const navigate = useNavigate();
  const { patients, departments, completeTriageAssessment, registerPatient, showToast } = useApp();
  const { currentUser } = useAuth();

  // Patient Selection State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // New Patient Form State
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    bloodGroup: 'O+',
    genotype: 'AA',
    existingConditions: '',
    allergies: '',
    currentMedications: ''
  });

  // Clinical Symptoms State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('< 6 hours');
  const [painLevel, setPainLevel] = useState(4);
  const [isPainUnreportable, setIsPainUnreportable] = useState(false);

  // Arrival Logistics State
  const [arrivalTransport, setArrivalTransport] = useState('AMBULANCE');

  // Vital Signs State - blank by default (nullable)
  const [vitals, setVitals] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: ''
  });

  // AI Prediction State
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Nurse Decision State
  const [finalLevel, setFinalLevel] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const [assignedDeptId, setAssignedDeptId] = useState(departments[0]?.id || 'dept-er');

  // Confirmation Screen Modal State
  const [completedTicket, setCompletedTicket] = useState(null);

  // Selected Patient Details
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Filtered patients for dropdown search
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.hospitalId.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Run AI Triage Prediction
  const handleRunPrediction = async () => {
    if (!chiefComplaint) {
      showToast('Validation Error', 'Please enter a chief complaint before running prediction.', 'warning');
      return;
    }
    setIsPredicting(true);
    try {
      const activePain = isPainUnreportable ? null : painLevel;
      const result = await triageService.runPrediction(vitals, chiefComplaint, symptoms, activePain, {
        gender: selectedPatient?.gender || 'M',
        arrival_transport: arrivalTransport
      });
      setPredictionResult(result);
      setFinalLevel(result.prediction);
      setOverrideReason('');
      setOverrideError('');
      if (result.manual_assessment_recommended) {
        showToast(
          'Manual Assessment Recommended',
          `Model predicted ${result.label}, but fewer than 3 core vitals were usable. Please assess manually.`,
          'warning'
        );
      } else {
        showToast(
          'AI Prediction Ready',
          `Predicted ${result.label} (${result.triage_label || result.color}).`,
          'info'
        );
      }
    } catch (e) {
      showToast('Error', 'Failed to calculate triage prediction.', 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  // Register New Patient Handler
  const handleRegisterNewPatient = async (e) => {
    e.preventDefault();
    if (!newPatientData.name || !newPatientData.age) return;

    const patient = await registerPatient({
      name: newPatientData.name,
      age: parseInt(newPatientData.age),
      gender: newPatientData.gender,
      phone: newPatientData.phone || '+234 800 000 0000',
      bloodGroup: newPatientData.bloodGroup,
      genotype: newPatientData.genotype,
      existingConditions: newPatientData.existingConditions ? newPatientData.existingConditions.split(',').map(s => s.trim()) : ['None recorded'],
      allergies: newPatientData.allergies ? newPatientData.allergies.split(',').map(s => s.trim()) : ['None known'],
      currentMedications: newPatientData.currentMedications ? newPatientData.currentMedications.split(',').map(s => s.trim()) : ['None']
    });

    setSelectedPatientId(patient.id);
    setIsRegisterModalOpen(false);
  };

  // Submit Final Triage Assessment
  const handleSubmitAssessment = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      showToast('Missing Patient', 'Please select or register a patient first.', 'warning');
      return;
    }

    if (!chiefComplaint) {
      showToast('Missing Complaint', 'Please record the patient chief complaint.', 'warning');
      return;
    }

    if (!finalLevel) {
      showToast('Missing Triage Decision', 'Please run the AI predictor or select a final triage urgency level.', 'warning');
      return;
    }

    const normalizeAcuity = (lvl) => {
      if (!lvl) return '';
      const s = String(lvl).trim().toLowerCase();
      if (s.includes('immediate') || s.includes('1') || s.includes('red')) return 'immediate';
      if (s.includes('emergent') || s.includes('2') || s.includes('orange')) return 'emergent';
      if (s.includes('urgent') && !s.includes('less') && !s.includes('non')) return 'urgent';
      if (s.includes('less') || s.includes('4') || s.includes('green')) return 'less urgent';
      if (s.includes('non') || s.includes('5') || s.includes('blue')) return 'non-urgent';
      return s;
    };

    const isOverridden = Boolean(predictionResult && finalLevel && normalizeAcuity(predictionResult.prediction) !== normalizeAcuity(finalLevel));

    // Helper to safely parse nullable vital numbers: strict null for blank or NaN
    const parseNullable = (v) => (v !== null && v !== undefined && String(v).trim() !== '' && !isNaN(Number(v))) ? Number(v) : null;

    let sbpVal = null;
    let dbpVal = null;
    if (vitals.bloodPressure && String(vitals.bloodPressure).includes('/')) {
      const parts = String(vitals.bloodPressure).split('/');
      sbpVal = parseNullable(parts[0]);
      dbpVal = parseNullable(parts[1]);
    } else if (vitals.bloodPressure) {
      sbpVal = parseNullable(vitals.bloodPressure);
    }

    const tempVal = parseNullable(vitals.temperature);
    const hrVal = parseNullable(vitals.heartRate);
    const rrVal = parseNullable(vitals.respiratoryRate);
    const spo2Val = parseNullable(vitals.oxygenSaturation);
    const painVal = isPainUnreportable ? null : parseNullable(painLevel);

    const assessmentPayload = {
      patient_id: selectedPatient.patient_id || selectedPatient.id,
      patientId: selectedPatient.patient_id || selectedPatient.id,
      patientName: selectedPatient.name,
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      nurseId: currentUser?.id || currentUser?.user_id || 'usr-n1',
      nurseName: currentUser?.name || currentUser?.full_name || 'Nurse Amina Bello',
      chiefComplaint,
      symptoms,
      symptomDuration,
      arrival_transport: arrivalTransport,
      pain_score: painVal,
      painLevel: painVal,
      temperature: tempVal,
      temperature_unit: 'C',
      heart_rate: hrVal,
      respiratory_rate: rrVal,
      spo2: spo2Val,
      systolic_bp: sbpVal,
      diastolic_bp: dbpVal,
      vitals: {
        temperature: tempVal,
        bloodPressure: vitals.bloodPressure || null,
        systolic_bp: sbpVal,
        diastolic_bp: dbpVal,
        heartRate: hrVal,
        respiratoryRate: rrVal,
        oxygenSaturation: spo2Val,
        weight: parseNullable(vitals.weight),
        height: parseNullable(vitals.height)
      },
      predictedLevel: predictionResult?.prediction || finalLevel,
      predictionConfidence: predictionResult?.confidence || 90,
      finalTriageLevel: finalLevel,
      override: isOverridden,
      overrideReason: isOverridden ? overrideReason : '',
      nurse_override: {
        is_overridden: isOverridden,
        override_acuity: finalLevel,
        override_reason: isOverridden ? overrideReason : ''
      },
      departmentId: assignedDeptId,
    };

    const result = await completeTriageAssessment(assessmentPayload);

    // Compute estimated wait & position
    const dept = departments.find(d => d.id === assignedDeptId);
    const waitTimes = {
      'Immediate': 'Immediate (<5m)',
      'Emergent': '10-15m',
      'Urgent': '30-45m',
      'Less Urgent': '60-90m',
      'Non-urgent': '120m+',
      'LEVEL 1': 'Immediate (<5m)',
      'LEVEL 2': '10-15m',
      'LEVEL 3': '30-45m',
      'LEVEL 4': '60-90m',
      'LEVEL 5': '120m+',
      'RED': 'Immediate (<5m)',
      'AMBER': '20-30m',
      'GREEN': '45-60m'
    };

    const qNum = result?.queueEntry?.queueNumber || `Q-${Date.now().toString().slice(-4)}`;
    const deptName = result?.queueEntry?.departmentName || dept?.name || 'Emergency';

    setCompletedTicket({
      queueNumber: qNum,
      patientName: selectedPatient.name,
      departmentName: deptName,
      triageLevel: finalLevel,
      position: result?.queueEntry?.queue_position || (dept ? dept.currentQueueLength + 1 : 1),
      estimatedWaitTime: waitTimes[finalLevel] || '20-30m'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileHeart className="text-clinical-600" size={22} />
            <span>New Clinical Triage Assessment</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Structured intake, vital signs logging, AI triage decision support, and queue department assignment.
          </p>
        </div>

        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Triage Officer:</span> <span className="text-slate-700 dark:text-slate-300 font-bold">{currentUser?.name}</span>
        </div>
      </div>

      <form onSubmit={handleSubmitAssessment} className="space-y-6">
        {/* Step 1: Patient Selection / Registration */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinical-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Patient Identification</h3>
            </div>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-clinical-700 dark:text-clinical-400 bg-clinical-50 dark:bg-clinical-950/40 hover:bg-clinical-100 dark:hover:bg-clinical-900/50 border border-clinical-200 dark:border-clinical-800 rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Register New Patient</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SelectInput
                label="Select Arrived Patient"
                id="select-patient"
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                placeholder="-- Choose patient from intake registry --"
                options={filteredPatients.map(p => ({
                  value: p.id,
                  label: `${p.name} · ${p.age}y, ${p.gender}`
                }))}
              />
              {patientSearch && filteredPatients.length === 0 && (
                <p className="text-[11px] text-rose-500 mt-1">No patient found matching "{patientSearch}"</p>
              )}
            </div>

            {/* Quick search input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick Filter by Name
              </label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Type name to narrow list..."
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-clinical-500 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>
          </div>

          {/* Patient Details Snapshot Banner */}
          {selectedPatient ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-clinical-100 dark:bg-clinical-950/60 text-clinical-800 dark:text-clinical-400 font-bold flex items-center justify-center text-sm border border-clinical-200 dark:border-clinical-800">
                    {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedPatient.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedPatient.age} years • {selectedPatient.gender}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Blood/Genotype: </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.bloodGroup || 'O+'} / {selectedPatient.genotype || 'AA'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Existing Conditions:</span>
                  <span className="semibold text-slate-700 dark:text-slate-300">{selectedPatient.existingConditions?.join(', ') || 'None'}</span>
                </div>
                <div>
                  <span className="text-rose-500 font-bold block text-[11px]">Allergies:</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">{selectedPatient.allergies?.join(', ') || 'None known'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Active Medications:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPatient.currentMedications?.join(', ') || 'None'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No patient selected. Please select a patient above or register a new walk-in patient.
            </div>
          )}

          {/* Arrival Logistics (Model Contract: arrival_transport) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-xs">
              <SelectInput
                label="Arrival Transport Mode"
                id="arrival-transport"
                required
                value={arrivalTransport}
                onChange={(e) => setArrivalTransport(e.target.value)}
                options={[
                  { value: 'AMBULANCE', label: 'AMBULANCE' },
                  { value: 'WALK IN', label: 'WALK IN' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Step 2: Symptoms & Clinical Complaint */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="w-6 h-6 rounded-full bg-clinical-600 text-white font-bold text-xs flex items-center justify-center">2</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chief Complaint & Symptoms</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <FormInput
                label="Chief Complaint"
                id="complaint"
                required
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Acute crushing retrosternal chest pain or High fever with vomiting"
                helperText="Primary reason for seeking emergency hospital care"
              />
            </div>

            <div>
              <SelectInput
                label="Symptom Duration"
                id="duration"
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                options={[
                  { value: '< 6 hours', label: '< 6 hours' },
                  { value: '6 - 24 hours', label: '6 - 24 hours' },
                  { value: '1 - 3 days', label: '1 - 3 days' },
                  { value: '1 week', label: '1 week' },
                  { value: '2 weeks', label: '2 weeks' },
                  { value: '> 2 weeks', label: '> 2 weeks' }
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Associated Symptoms & Clinical Narrative
            </label>
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Detail onset, radiation, vomiting, diaphoresis, dyspnea, neurological symptoms..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-clinical-500 focus:outline-none focus:ring-2 focus:ring-clinical-500/20 bg-white dark:bg-slate-800"
            />
          </div>

          {/* Pain Scale (1 to 10 or Not Reportable) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Self-Reported Pain Scale:{' '}
                {isPainUnreportable ? (
                  <span className="text-slate-500 dark:text-slate-400 font-semibold italic">Not Reportable / Unconscious</span>
                ) : (
                  <span className="text-clinical-700 dark:text-clinical-400 font-black">{painLevel} / 10</span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={isPainUnreportable}
                    onChange={(e) => {
                      const unreportable = e.target.checked;
                      setIsPainUnreportable(unreportable);
                      if (unreportable) {
                        setPainLevel(null);
                      } else {
                        setPainLevel(4);
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-clinical-600 focus:ring-clinical-500 w-3.5 h-3.5"
                  />
                  <span>Not Reportable / Unconscious</span>
                </label>
                {!isPainUnreportable && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                    {painLevel >= 8 ? 'Severe / Excruciating' : painLevel >= 5 ? 'Moderate' : painLevel >= 1 ? 'Mild' : 'No pain'}
                  </span>
                )}
              </div>
            </div>

            {!isPainUnreportable ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPainLevel(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      painLevel === num
                        ? num >= 8 ? 'bg-rose-600 text-white shadow-xs' : num >= 5 ? 'bg-amber-500 text-white shadow-xs' : 'bg-clinical-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                Pain score is set to <strong className="font-mono text-slate-700 dark:text-slate-300">null</strong>. Patient is unable to verbally or behaviorally self-report pain.
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Vital Signs Logging */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="w-6 h-6 rounded-full bg-clinical-600 text-white font-bold text-xs flex items-center justify-center">3</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recorded Physiological Vital Signs</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <FormInput
              label="Temperature (°C)"
              id="temp"
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
              suffix="°C"
              placeholder="37.0"
            />

            <FormInput
              label="Blood Pressure (mmHg)"
              id="bp"
              value={vitals.bloodPressure}
              onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
              placeholder="120/80"
              suffix="mmHg"
            />

            <FormInput
              label="Heart Rate (bpm)"
              id="hr"
              type="number"
              value={vitals.heartRate}
              onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
              suffix="bpm"
              placeholder="75"
            />

            <FormInput
              label="Resp. Rate (bpm)"
              id="rr"
              type="number"
              value={vitals.respiratoryRate}
              onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
              suffix="/min"
              placeholder="18"
            />

            <FormInput
              label="Oxygen Saturation (SpO2)"
              id="spo2"
              type="number"
              value={vitals.oxygenSaturation}
              onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
              suffix="%"
              placeholder="98"
            />

            <FormInput
              label="Body Weight (kg)"
              id="weight"
              type="number"
              value={vitals.weight}
              onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
              suffix="kg"
              placeholder="70"
            />

            <FormInput
              label="Height (cm)"
              id="height"
              type="number"
              value={vitals.height}
              onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
              suffix="cm"
              placeholder="175"
            />
          </div>
        </div>

        {/* Step 4: ML Triage Prediction Card */}
        <div className="space-y-2">
          <TriagePredictorCard
            predictionResult={predictionResult}
            isLoading={isPredicting}
            onRunPrediction={handleRunPrediction}
            canRun={!!chiefComplaint}
          />
        </div>

        {/* Step 5: Nurse Override Panel */}
        <div className="space-y-2">
          <NurseOverridePanel
            predictedLevel={predictionResult?.prediction}
            finalLevel={finalLevel}
            onChangeFinalLevel={(lvl) => {
              setFinalLevel(lvl);
              setOverrideError('');
            }}
            overrideReason={overrideReason}
            onChangeOverrideReason={(r) => {
              setOverrideReason(r);
              setOverrideError('');
            }}
            overrideError={overrideError}
          />
        </div>

        {/* Step 6: Department Assignment & Queue Submission */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="w-6 h-6 rounded-full bg-clinical-600 text-white font-bold text-xs flex items-center justify-center">4</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Routing & Queue Dispatch</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Destination Department"
              id="destination-department"
              required
              value={assignedDeptId}
              onChange={(e) => setAssignedDeptId(e.target.value)}
              options={departments.map(d => ({
                value: d.id,
                label: `${d.name} (${d.code}) · ${d.currentQueueLength} in queue (Avg ${formatWaitTime(d.averageWaitTime)})`
              }))}
            />

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Final Urgency Classification:</span>
                <div className="mt-0.5">
                  <TriageBadge level={finalLevel || 'LEVEL 4'} size="md" />
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Department Capacity:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {departments.find(d => d.id === assignedDeptId)?.capacity || 30} beds
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/nurse')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <span>Complete Triage & Add to Queue</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </form>

      {/* Modal 1: Register New Patient Form */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Quick Patient Registration"
        subtitle="Intake registration for walk-in or newly admitted hospital emergency patients."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRegisterNewPatient} className="space-y-4">
          <FormInput
            label="Full Name"
            id="new-name"
            required
            value={newPatientData.name}
            onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
            placeholder="e.g. Babatunde Adeleke"
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Age (Years)"
              id="new-age"
              type="number"
              required
              min="0"
              max="120"
              value={newPatientData.age}
              onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
              placeholder="34"
            />

            <SelectInput
              label="Gender"
              id="new-gender"
              value={newPatientData.gender}
              onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' }
              ]}
            />
          </div>

          <FormInput
            label="Phone Number"
            id="new-phone"
            value={newPatientData.phone}
            onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
            placeholder="+234 800 000 0000"
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Blood Group"
              id="new-blood-group"
              value={newPatientData.bloodGroup}
              onChange={(e) => setNewPatientData({ ...newPatientData, bloodGroup: e.target.value })}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', 'Pending Lab']}
            />

            <SelectInput
              label="Genotype"
              id="new-genotype"
              value={newPatientData.genotype}
              onChange={(e) => setNewPatientData({ ...newPatientData, genotype: e.target.value })}
              options={['AA', 'AS', 'SS', 'AC', 'SC', 'Unknown', 'Pending Lab']}
            />
          </div>

          <FormInput
            label="Known Allergies (Comma separated)"
            id="new-allergies"
            value={newPatientData.allergies}
            onChange={(e) => setNewPatientData({ ...newPatientData, allergies: e.target.value })}
            placeholder="e.g. Penicillin, Sulfa, Peanuts"
          />

          <FormInput
            label="Pre-existing Medical Conditions"
            id="new-conditions"
            value={newPatientData.existingConditions}
            onChange={(e) => setNewPatientData({ ...newPatientData, existingConditions: e.target.value })}
            placeholder="e.g. Hypertension, Diabetes, Asthma"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-clinical-600 hover:bg-clinical-700 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Save & Select Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Triage Completion & Queue Ticket Confirmation */}
      {completedTicket && (
        <Modal
          isOpen={!!completedTicket}
          onClose={() => {
            setCompletedTicket(null);
            navigate('/nurse/queue');
          }}
          title="Triage Assessment Completed"
          subtitle="Patient successfully classified and dispatched to department queue."
          maxWidth="max-w-md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Assigned Clinical Queue Number
              </span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {completedTicket.queueNumber}
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {completedTicket.patientName}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Department:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{completedTicket.departmentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Triage Urgency:</span>
                <TriageBadge level={completedTicket.triageLevel} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Current Position:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">#{completedTicket.position} in queue</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Waiting Time:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{completedTicket.estimatedWaitTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompletedTicket(null);
                  setSelectedPatientId('');
                  setChiefComplaint('');
                  setSymptoms('');
                  setPredictionResult(null);
                  setFinalLevel(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Assess Another Patient
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompletedTicket(null);
                  navigate('/nurse/queue');
                }}
                className="px-5 py-2 rounded-xl bg-clinical-600 text-white text-xs font-bold hover:bg-clinical-700 shadow-xs transition-colors"
              >
                Go to Queue
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

