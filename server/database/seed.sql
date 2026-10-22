-- ==========================================================
-- Intelligent Patient Triage & Hospital Queue Management System
-- Database Seed Data (PostgreSQL) - 5-Level ESI with Doctors
-- Database Name: patient_triage
-- ==========================================================

-- Clean existing data
TRUNCATE TABLE queue_entries, acuity_predictions, triage_assessments, patients, users CASCADE;

-- 1. Insert Users (1 Admin, 2 Nurses, 4 Doctors across departments)
-- Passwords are all 'password123' (hash: $2a$10$wWv6E8oEaC7J6Uu29TqRmeI9iOqDkYQy1K4l3jV0P9z7v8h7Lw3m6)
INSERT INTO users (user_id, full_name, username, password_hash, role, department, is_on_duty, created_at)
VALUES
('a0000000-0000-0000-0000-000000000001', 'Dr. Gregory House', 'admin', '$2a$10$tZPv8N06757G6m4t5Ym09e.08pGk8/7y1f0n1o9oQ/qE0u5u1K9eK', 'ADMIN', 'Emergency', true, NOW()),
('a0000000-0000-0000-0000-000000000002', 'Nurse Sarah Connor', 'nurse.sarah', '$2a$10$6RkYv.Z6v8F3U5e0y8Z4u.lFz2f3E8L9U7P6k5j4l3i2k1j0h9g8f', 'NURSE', 'Emergency', true, NOW()),
('a0000000-0000-0000-0000-000000000003', 'Nurse John Watson', 'nurse.john', '$2a$10$6RkYv.Z6v8F3U5e0y8Z4u.lFz2f3E8L9U7P6k5j4l3i2k1j0h9g8f', 'NURSE', 'General Medical', true, NOW()),
('a0000000-0000-0000-0000-000000000004', 'Dr. James Wilson', 'doctor.wilson', '$2a$10$6RkYv.Z6v8F3U5e0y8Z4u.lFz2f3E8L9U7P6k5j4l3i2k1j0h9g8f', 'DOCTOR', 'Emergency', true, NOW()),
('a0000000-0000-0000-0000-000000000005', 'Dr. Lisa Cuddy', 'doctor.cuddy', '$2a$10$6RkYv.Z6v8F3U5e0y8Z4u.lFz2f3E8L9U7P6k5j4l3i2k1j0h9g8f', 'DOCTOR', 'Emergency / Critical Care', true, NOW()),
('a0000000-0000-0000-0000-000000000006', 'Dr. Eric Foreman', 'doctor.foreman', '$2a$10$6RkYv.Z6v8F3U5e0y8Z4u.lFz2f3E8L9U7P6k5j4l3i2k1j0h9g8f', 'DOCTOR', 'General Medical', false, NOW()),
('a0000000-0000-0000-0000-000000000007', 'Dr. Allison Cameron', 'doctor.cameron', '$2a$10$6RkYv.Z6v8F3U5e0y8Z4u.lFz2f3E8L9U7P6k5j4l3i2k1j0h9g8f', 'DOCTOR', 'Outpatient', false, NOW());

-- 2. Insert Sample Patients (5 Patients for 5 ESI Levels)
INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone_number, registered_at)
VALUES
('b0000000-0000-0000-0000-000000000001', 'Arthur', 'Dent', '1982-03-11', 'Male', '+1-555-0101', NOW() - INTERVAL '1 hour'),
('b0000000-0000-0000-0000-000000000002', 'Trillian', 'Astra', '1990-07-25', 'Female', '+1-555-0102', NOW() - INTERVAL '45 minutes'),
('b0000000-0000-0000-0000-000000000003', 'Ford', 'Prefect', '1975-11-19', 'Male', '+1-555-0103', NOW() - INTERVAL '30 minutes'),
('b0000000-0000-0000-0000-000000000004', 'Zaphod', 'Beeblebrox', '1988-04-12', 'Non-Binary', '+1-555-0104', NOW() - INTERVAL '2 hours'),
('b0000000-0000-0000-0000-000000000005', 'Marvin', 'Android', '2000-01-01', 'Male', '+1-555-0105', NOW() - INTERVAL '3 hours');

-- 3. Insert Triage Assessments
INSERT INTO triage_assessments (assessment_id, patient_id, nurse_id, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, spo2, temperature, pain_score, chief_complaint_code, assessed_at)
VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 190, 120, 135, 32, 88.0, 37.8, 9, 101, NOW() - INTERVAL '25 minutes'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 145, 95, 105, 24, 95.0, 38.6, 8, 204, NOW() - INTERVAL '35 minutes'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 125, 80, 85, 20, 96.5, 37.0, 4, 301, NOW() - INTERVAL '15 minutes'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 120, 78, 76, 16, 98.5, 36.8, 3, 402, NOW() - INTERVAL '10 minutes'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 118, 76, 72, 16, 99.0, 36.6, 2, 405, NOW() - INTERVAL '90 minutes');

-- 4. Insert Acuity Predictions (5 ESI Levels)
INSERT INTO acuity_predictions (prediction_id, assessment_id, predicted_acuity, confidence_score, model_used, predicted_at)
VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Immediate', 0.9650, 'Random Forest', NOW() - INTERVAL '25 minutes'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Emergent', 0.9120, 'XGBoost', NOW() - INTERVAL '35 minutes'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Urgent', 0.8840, 'Random Forest', NOW() - INTERVAL '15 minutes'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Less Urgent', 0.9100, 'XGBoost', NOW() - INTERVAL '10 minutes'),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Non-urgent', 0.9400, 'Random Forest', NOW() - INTERVAL '90 minutes');

-- 5. Insert Queue Entries
INSERT INTO queue_entries (queue_id, patient_id, prediction_id, acuity_level, department, queue_position, status, queued_at, attended_at)
VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Immediate', 'Emergency', 1, 'Waiting', NOW() - INTERVAL '25 minutes', NULL),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Emergent', 'Emergency / Critical Care', 2, 'Waiting', NOW() - INTERVAL '35 minutes', NULL),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Urgent', 'General Medical', 3, 'Waiting', NOW() - INTERVAL '15 minutes', NULL),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'Less Urgent', 'General Medical', 4, 'Waiting', NOW() - INTERVAL '10 minutes', NULL),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'Non-urgent', 'Outpatient', 0, 'Completed', NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '30 minutes');
