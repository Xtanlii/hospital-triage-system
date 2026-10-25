const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

async function seed() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing data in reverse order of foreign keys
  await prisma.queueEntry.deleteMany();
  await prisma.acuityPrediction.deleteMany();
  await prisma.triageAssessment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing records.');

  // 1. Seed Users (Admin, Nurses, and Department Doctors) with Nigerian names
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      full_name: 'Dr. Chinedu Okeke',
      username: 'admin',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      department: 'Emergency',
      is_on_duty: true
    }
  });

  const nurseSarah = await prisma.user.create({
    data: {
      full_name: 'Nurse Funke Adeyemi',
      username: 'nurse.sarah',
      password_hash: passwordHash,
      role: 'NURSE',
      department: 'Emergency',
      is_on_duty: true
    }
  });

  const nurseJohn = await prisma.user.create({
    data: {
      full_name: 'Nurse Tunde Bakare',
      username: 'nurse.john',
      password_hash: passwordHash,
      role: 'NURSE',
      department: 'General Medical',
      is_on_duty: true
    }
  });

  // Seed Doctors across different departments with check-in/out states
  const doctorWilson = await prisma.user.create({
    data: {
      full_name: 'Dr. Ibrahim Musa',
      username: 'doctor.wilson',
      password_hash: passwordHash,
      role: 'DOCTOR',
      department: 'Emergency',
      is_on_duty: true // Active on duty
    }
  });

  const doctorCuddy = await prisma.user.create({
    data: {
      full_name: 'Dr. Ngozi Eze',
      username: 'doctor.cuddy',
      password_hash: passwordHash,
      role: 'DOCTOR',
      department: 'Emergency / Critical Care',
      is_on_duty: true // Active on duty
    }
  });

  const doctorForeman = await prisma.user.create({
    data: {
      full_name: 'Dr. Emeka Nwachukwu',
      username: 'doctor.foreman',
      password_hash: passwordHash,
      role: 'DOCTOR',
      department: 'General Medical',
      is_on_duty: false // Checked out / off duty
    }
  });

  const doctorCameron = await prisma.user.create({
    data: {
      full_name: 'Dr. Halima Abdullahi',
      username: 'doctor.cameron',
      password_hash: passwordHash,
      role: 'DOCTOR',
      department: 'Outpatient',
      is_on_duty: false // Checked out / off duty
    }
  });

  console.log('Created Users: Admin, 2 Nurses, and 4 Department Doctors (2 on-duty, 2 off-duty)');

  // 2. Seed Patients with Nigerian names (5 patients for 5 ESI levels)
  const patient1 = await prisma.patient.create({
    data: {
      first_name: 'Chukwudi',
      last_name: 'Okafor',
      date_of_birth: new Date('1982-03-11'),
      gender: 'Male',
      phone_number: '+234-803-451-2091'
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      first_name: 'Amina',
      last_name: 'Bello',
      date_of_birth: new Date('1990-07-25'),
      gender: 'Female',
      phone_number: '+234-806-218-9940'
    }
  });

  const patient3 = await prisma.patient.create({
    data: {
      first_name: 'Oluwaseun',
      last_name: 'Adewale',
      date_of_birth: new Date('1975-11-19'),
      gender: 'Male',
      phone_number: '+234-802-773-4102'
    }
  });

  const patient4 = await prisma.patient.create({
    data: {
      first_name: 'Chioma',
      last_name: 'Nwosu',
      date_of_birth: new Date('1988-04-12'),
      gender: 'Female',
      phone_number: '+234-809-334-8721'
    }
  });

  const patient5 = await prisma.patient.create({
    data: {
      first_name: 'Babajide',
      last_name: 'Sanusi',
      date_of_birth: new Date('2000-01-01'),
      gender: 'Male',
      phone_number: '+234-805-612-3390'
    }
  });

  console.log('Created 5 Patients with Nigerian names');

  // 3. Seed Triage Assessments, Predictions, and Queue Entries (All waiting times < 30 mins)
  // ── ESI Level 1: Immediate (Red) ── Emergency department (4 mins wait)
  const assessment1 = await prisma.triageAssessment.create({
    data: {
      patient_id: patient1.patient_id,
      nurse_id: nurseSarah.user_id,
      arrival_transport: 'AMBULANCE',
      arrival_time: new Date(Date.now() - 6 * 60 * 1000),
      systolic_bp: 190,
      diastolic_bp: 120,
      heart_rate: 135,
      respiratory_rate: 32,
      spo2: 88.0,
      temperature: 37.8,
      pain_score: 9,
      chief_complaint_code: 101 // Severe Chest Pain
    }
  });

  const prediction1 = await prisma.acuityPrediction.create({
    data: {
      assessment_id: assessment1.assessment_id,
      predicted_acuity: 'Immediate',
      acuity_color: 'Red',
      confidence_score: 0.9650,
      model_used: 'XGBoost'
    }
  });

  await prisma.queueEntry.create({
    data: {
      patient_id: patient1.patient_id,
      prediction_id: prediction1.prediction_id,
      acuity_level: 'Immediate',
      department: 'Emergency',
      queue_position: 1,
      status: 'Waiting',
      queued_at: new Date(Date.now() - 4 * 60 * 1000)
    }
  });

  // ── ESI Level 2: Emergent (Orange) ── Emergency / Critical Care department (11 mins wait)
  const assessment2 = await prisma.triageAssessment.create({
    data: {
      patient_id: patient2.patient_id,
      nurse_id: nurseSarah.user_id,
      arrival_transport: 'AMBULANCE',
      arrival_time: new Date(Date.now() - 14 * 60 * 1000),
      systolic_bp: 145,
      diastolic_bp: 95,
      heart_rate: 105,
      respiratory_rate: 24,
      spo2: 95.0,
      temperature: 38.6,
      pain_score: 8,
      chief_complaint_code: 204 // Acute Abdomen
    }
  });

  const prediction2 = await prisma.acuityPrediction.create({
    data: {
      assessment_id: assessment2.assessment_id,
      predicted_acuity: 'Emergent',
      acuity_color: 'Orange',
      confidence_score: 0.9120,
      model_used: 'XGBoost'
    }
  });

  await prisma.queueEntry.create({
    data: {
      patient_id: patient2.patient_id,
      prediction_id: prediction2.prediction_id,
      acuity_level: 'Emergent',
      department: 'Emergency / Critical Care',
      queue_position: 2,
      status: 'Waiting',
      queued_at: new Date(Date.now() - 11 * 60 * 1000)
    }
  });

  // ── ESI Level 3: Urgent (Yellow) ── General Medical department (17 mins wait)
  const assessment3 = await prisma.triageAssessment.create({
    data: {
      patient_id: patient3.patient_id,
      nurse_id: nurseJohn.user_id,
      arrival_transport: 'WALK IN',
      arrival_time: new Date(Date.now() - 20 * 60 * 1000),
      systolic_bp: 125,
      diastolic_bp: 80,
      heart_rate: 85,
      respiratory_rate: 20,
      spo2: 96.5,
      temperature: 37.0,
      pain_score: 4,
      chief_complaint_code: 301 // Mild/Moderate Dyspnea
    }
  });

  const prediction3 = await prisma.acuityPrediction.create({
    data: {
      assessment_id: assessment3.assessment_id,
      predicted_acuity: 'Urgent',
      acuity_color: 'Yellow',
      confidence_score: 0.8840,
      model_used: 'XGBoost'
    }
  });

  await prisma.queueEntry.create({
    data: {
      patient_id: patient3.patient_id,
      prediction_id: prediction3.prediction_id,
      acuity_level: 'Urgent',
      department: 'General Medical',
      queue_position: 3,
      status: 'Waiting',
      queued_at: new Date(Date.now() - 17 * 60 * 1000)
    }
  });

  // ── ESI Level 4: Less Urgent (Green) ── General Medical department (22 mins wait)
  const assessment4Record = await prisma.triageAssessment.create({
    data: {
      patient_id: patient4.patient_id,
      nurse_id: nurseJohn.user_id,
      arrival_transport: 'WALK IN',
      arrival_time: new Date(Date.now() - 25 * 60 * 1000),
      systolic_bp: 120,
      diastolic_bp: 78,
      heart_rate: 76,
      respiratory_rate: 16,
      spo2: 98.5,
      temperature: 36.8,
      pain_score: 3,
      chief_complaint_code: 402 // Mild sprain
    }
  });

  const prediction4 = await prisma.acuityPrediction.create({
    data: {
      assessment_id: assessment4Record.assessment_id,
      predicted_acuity: 'Less Urgent',
      acuity_color: 'Green',
      confidence_score: 0.9100,
      model_used: 'XGBoost'
    }
  });

  await prisma.queueEntry.create({
    data: {
      patient_id: patient4.patient_id,
      prediction_id: prediction4.prediction_id,
      acuity_level: 'Less Urgent',
      department: 'General Medical',
      queue_position: 4,
      status: 'Waiting',
      queued_at: new Date(Date.now() - 22 * 60 * 1000)
    }
  });

  // ── ESI Level 5: Non-urgent (Blue) ── Outpatient department (26 mins total, Completed)
  const assessment5 = await prisma.triageAssessment.create({
    data: {
      patient_id: patient5.patient_id,
      nurse_id: nurseJohn.user_id,
      arrival_transport: 'WALK IN',
      arrival_time: new Date(Date.now() - 28 * 60 * 1000),
      systolic_bp: 118,
      diastolic_bp: 76,
      heart_rate: 72,
      respiratory_rate: 16,
      spo2: 99.0,
      temperature: 36.6,
      pain_score: 2,
      chief_complaint_code: 405 // Minor cut/sprain
    }
  });

  const prediction5 = await prisma.acuityPrediction.create({
    data: {
      assessment_id: assessment5.assessment_id,
      predicted_acuity: 'Non-urgent',
      acuity_color: 'Blue',
      confidence_score: 0.9400,
      model_used: 'XGBoost'
    }
  });

  await prisma.queueEntry.create({
    data: {
      patient_id: patient5.patient_id,
      prediction_id: prediction5.prediction_id,
      acuity_level: 'Non-urgent',
      department: 'Outpatient',
      queue_position: 0,
      status: 'Completed',
      queued_at: new Date(Date.now() - 26 * 60 * 1000),
      attended_at: new Date(Date.now() - 8 * 60 * 1000)
    }
  });

  console.log('Seeded Triage Assessments, Predictions, and Queue Entries for all 5 ESI levels (<30m wait times).');
  console.log('--- Database Seeding Complete ---');
}

if (require.main === module) {
  seed()
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seed;
