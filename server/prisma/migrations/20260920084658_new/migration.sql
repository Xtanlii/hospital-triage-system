-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "patients" (
    "patient_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "phone_number" VARCHAR(30),
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "triage_assessments" (
    "assessment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "nurse_id" UUID NOT NULL,
    "systolic_bp" INTEGER NOT NULL,
    "diastolic_bp" INTEGER NOT NULL,
    "heart_rate" INTEGER NOT NULL,
    "respiratory_rate" INTEGER NOT NULL,
    "spo2" DECIMAL(5,2) NOT NULL,
    "temperature" DECIMAL(4,1) NOT NULL,
    "pain_score" INTEGER NOT NULL,
    "chief_complaint_code" INTEGER NOT NULL,
    "assessed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triage_assessments_pkey" PRIMARY KEY ("assessment_id")
);

-- CreateTable
CREATE TABLE "acuity_predictions" (
    "prediction_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "predicted_acuity" VARCHAR(20) NOT NULL,
    "confidence_score" DECIMAL(5,4) NOT NULL,
    "model_used" VARCHAR(100) NOT NULL,
    "predicted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acuity_predictions_pkey" PRIMARY KEY ("prediction_id")
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "queue_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "prediction_id" UUID NOT NULL,
    "acuity_level" VARCHAR(20) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "queue_position" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Waiting',
    "queued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended_at" TIMESTAMPTZ,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("queue_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "patients_phone_number_idx" ON "patients"("phone_number");

-- CreateIndex
CREATE INDEX "triage_assessments_patient_id_idx" ON "triage_assessments"("patient_id");

-- CreateIndex
CREATE INDEX "triage_assessments_nurse_id_idx" ON "triage_assessments"("nurse_id");

-- CreateIndex
CREATE INDEX "triage_assessments_assessed_at_idx" ON "triage_assessments"("assessed_at");

-- CreateIndex
CREATE UNIQUE INDEX "acuity_predictions_assessment_id_key" ON "acuity_predictions"("assessment_id");

-- CreateIndex
CREATE INDEX "acuity_predictions_assessment_id_idx" ON "acuity_predictions"("assessment_id");

-- CreateIndex
CREATE INDEX "queue_entries_patient_id_idx" ON "queue_entries"("patient_id");

-- CreateIndex
CREATE INDEX "queue_entries_prediction_id_idx" ON "queue_entries"("prediction_id");

-- CreateIndex
CREATE INDEX "queue_entries_status_idx" ON "queue_entries"("status");

-- CreateIndex
CREATE INDEX "queue_entries_acuity_level_idx" ON "queue_entries"("acuity_level");

-- CreateIndex
CREATE INDEX "queue_entries_queued_at_idx" ON "queue_entries"("queued_at");

-- AddForeignKey
ALTER TABLE "triage_assessments" ADD CONSTRAINT "triage_assessments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_assessments" ADD CONSTRAINT "triage_assessments_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuity_predictions" ADD CONSTRAINT "acuity_predictions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "triage_assessments"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "acuity_predictions"("prediction_id") ON DELETE CASCADE ON UPDATE CASCADE;
