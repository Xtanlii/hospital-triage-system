const { validateTriageInput } = require('../src/validators/triageValidators');
const mlService = require('../src/services/mlService');
const env = require('../src/config/env');
const { MLServiceUnavailableError } = require('../src/middleware/errorMiddleware');

describe('Clinical Triage Validation & ML Integration Tests', () => {
  const validVitals = {
    patient_id: 'a0000000-0000-4000-8000-000000000001',
    systolic_bp: 120,
    diastolic_bp: 80,
    heart_rate: 72,
    respiratory_rate: 16,
    spo2: 98.0,
    temperature: 36.8,
    pain_score: 3,
    chief_complaint_code: 101
  };

  test('Validates clinically plausible vitals with zero errors', () => {
    const errors = validateTriageInput(validVitals);
    expect(errors).toHaveLength(0);
  });

  test('Rejects invalid patient UUID format', () => {
    const invalid = { ...validVitals, patient_id: 'not-a-uuid' };
    const errors = validateTriageInput(invalid);
    expect(errors.some((e) => e.field === 'patient_id')).toBe(true);
  });

  test('Rejects diastolic BP higher than or equal to systolic BP', () => {
    const invalid = { ...validVitals, systolic_bp: 90, diastolic_bp: 95 };
    const errors = validateTriageInput(invalid);
    expect(errors.some((e) => e.field === 'diastolic_bp')).toBe(true);
  });

  test('Rejects oxygen saturation (SpO2) exceeding 100% or below 50%', () => {
    const tooHigh = { ...validVitals, spo2: 101 };
    const tooLow = { ...validVitals, spo2: 45 };
    expect(validateTriageInput(tooHigh).some((e) => e.field === 'spo2')).toBe(true);
    expect(validateTriageInput(tooLow).some((e) => e.field === 'spo2')).toBe(true);
  });

  test('Rejects pain scores outside of 0-10 integer range', () => {
    const outOfBounds = { ...validVitals, pain_score: 11 };
    expect(validateTriageInput(outOfBounds).some((e) => e.field === 'pain_score')).toBe(true);
  });

  test('Rejects non-physiologic body temperatures', () => {
    const hyperpyrexia = { ...validVitals, temperature: 48.0 };
    expect(validateTriageInput(hyperpyrexia).some((e) => e.field === 'temperature')).toBe(true);
  });

  test('Seamlessly falls back to Clinical ESI Rule Engine when ML service is down', async () => {
    const result = await mlService.predictAcuity({
      age: 45,
      gender: 'Male',
      systolic_bp: 120,
      diastolic_bp: 80,
      heart_rate: 75,
      respiratory_rate: 16,
      spo2: 98,
      temperature: 37.0,
      pain_score: 2,
      chief_complaint_code: 101
    });

    expect(result.is_offline_fallback).toBe(true);
    expect(result.predicted_acuity).toBeDefined();
    expect(result.model_used).toMatch(/Clinical ESI Rule Engine/);
  });

  test('Throws MLServiceUnavailableError when ML service is down and fallback is disabled', async () => {
    const originalSetting = env.ENABLE_ML_OFFLINE_FALLBACK;
    env.ENABLE_ML_OFFLINE_FALLBACK = false;

    try {
      await expect(
        mlService.predictAcuity({
          age: 45,
          gender: 'Male',
          systolic_bp: 120,
          diastolic_bp: 80,
          heart_rate: 75,
          respiratory_rate: 16,
          spo2: 98,
          temperature: 37.0,
          pain_score: 2,
          chief_complaint_code: 101
        })
      ).rejects.toThrow(MLServiceUnavailableError);
    } finally {
      env.ENABLE_ML_OFFLINE_FALLBACK = originalSetting;
    }
  });
});
