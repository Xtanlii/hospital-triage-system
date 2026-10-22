-- ==========================================================
-- Intelligent Patient Triage & Hospital Queue Management System
-- Database Schema (PostgreSQL)
-- Database Name: patient_triage
-- ==========================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('NURSE', 'ADMIN', 'DOCTOR')),
    department VARCHAR(100),
    is_on_duty BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone_number VARCHAR(30),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Triage Assessments Table
CREATE TABLE IF NOT EXISTS triage_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    nurse_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    systolic_bp INTEGER NOT NULL,
    diastolic_bp INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    respiratory_rate INTEGER NOT NULL,
    spo2 NUMERIC(5,2) NOT NULL,
    temperature NUMERIC(4,1) NOT NULL,
    pain_score INTEGER NOT NULL CHECK (pain_score >= 0 AND pain_score <= 10),
    chief_complaint_code INTEGER NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Acuity Predictions Table
CREATE TABLE IF NOT EXISTS acuity_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID UNIQUE NOT NULL REFERENCES triage_assessments(assessment_id) ON DELETE CASCADE,
    predicted_acuity VARCHAR(20) NOT NULL CHECK (predicted_acuity IN ('Critical', 'High', 'Moderate', 'Low')),
    confidence_score NUMERIC(5,4) NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Queue Entries Table
CREATE TABLE IF NOT EXISTS queue_entries (
    queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    prediction_id UUID NOT NULL REFERENCES acuity_predictions(prediction_id) ON DELETE CASCADE,
    acuity_level VARCHAR(20) NOT NULL CHECK (acuity_level IN ('Critical', 'High', 'Moderate', 'Low')),
    department VARCHAR(100) NOT NULL,
    queue_position INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'Called', 'In Progress', 'Completed', 'Cancelled')),
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for high-traffic and dashboard queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_triage_assessments_patient_id ON triage_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_assessments_nurse_id ON triage_assessments(nurse_id);
CREATE INDEX IF NOT EXISTS idx_triage_assessments_assessed_at ON triage_assessments(assessed_at);
CREATE INDEX IF NOT EXISTS idx_acuity_predictions_assessment_id ON acuity_predictions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_patient_id ON queue_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_prediction_id ON queue_entries(prediction_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_acuity_level ON queue_entries(acuity_level);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queued_at ON queue_entries(queued_at);

