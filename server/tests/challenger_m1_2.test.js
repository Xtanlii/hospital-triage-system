/**
 * Empirical Stress Test Harness — Challenger M1.2
 * 
 * Verifies:
 * 1. evaluateClinicalRules robustness:
 *    - All vitals null / empty
 *    - Partial null vitals (preventing false Level 1 due to null < 85)
 *    - Normal temp in °F (98.6 °F -> Non-urgent) and fever thresholds
 *    - Severe vitals with contract names (sbp, spo2, heartrate, resprate)
 *    - ESI Level 1–5 boundary transitions
 * 2. validateTriageInput with extreme valid and invalid inputs:
 *    - Bounds testing for all vitals (min, max, beyond min, beyond max)
 *    - Dual-unit temperature validation (°C and °F)
 *    - Diastolic vs Systolic relational check (dbp < sbp)
 *    - Arrival transport enum validation & arrival time ISO validation
 * 3. GET /api/departments and /api/departments/:id via supertest
 */

const request = require('supertest');
const app = require('../src/app');
const { evaluateClinicalRules } = require('../src/utils/clinicalRuleEngine');
const { validateTriageInput, VALID_ARRIVAL_TRANSPORTS } = require('../src/validators/triageValidators');
const { ACUITY_LEVELS } = require('../src/utils/acuityUtils');

describe('Challenger M1.2: Clinical Rule Engine Fallback Stress Suite', () => {
  const dummyUUID = 'a0000000-0000-4000-8000-000000000001';

  describe('1. evaluateClinicalRules: Null & Robustness Stress Tests', () => {
    test('All vitals null returns Level 5 Non-urgent (not Level 1 Immediate)', () => {
      const allNullContract = {
        sbp: null,
        dbp: null,
        heartrate: null,
        resprate: null,
        o2sat: null,
        temperature: null,
        pain: null,
        chief_complaint_code: null
      };

      const result = evaluateClinicalRules(allNullContract);
      expect(result.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
      expect(result.is_offline_fallback).toBe(true);
      expect(result.confidence_score).toBe(0.95);
    });

    test('Empty object and null/undefined input return Level 5 Non-urgent', () => {
      expect(evaluateClinicalRules({}).predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
      expect(evaluateClinicalRules(null).predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
      expect(evaluateClinicalRules(undefined).predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
    });

    test('Partial null vitals do NOT trigger false Level 1 due to null < 85', () => {
      // sbp: null, spo2: null, heart_rate: 75
      const partial1 = evaluateClinicalRules({ sbp: null, spo2: null, heart_rate: 75 });
      expect(partial1.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);

      // Contract names with partial nulls
      const partial2 = evaluateClinicalRules({ sbp: null, o2sat: null, heartrate: 75 });
      expect(partial2.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);

      // Only heart rate provided within normal limits
      const partial3 = evaluateClinicalRules({ heartrate: 72 });
      expect(partial3.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);

      // Only respiratory rate provided within normal limits
      const partial4 = evaluateClinicalRules({ resprate: 16 });
      expect(partial4.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);

      // Only normal BP provided
      const partial5 = evaluateClinicalRules({ sbp: 120, dbp: 80 });
      expect(partial5.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);

      // Only normal oxygen saturation provided
      const partial6 = evaluateClinicalRules({ o2sat: 99 });
      expect(partial6.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
    });

    test('Normal temp in °F (98.6 °F) returns Non-urgent (does not trigger fever Level 2)', () => {
      const resultF = evaluateClinicalRules({ temperature: 98.6 });
      expect(resultF.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);

      const resultFBaseline = evaluateClinicalRules({ temperature: 97.5 });
      expect(resultFBaseline.predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
    });

    test('High fever in °F and °C correctly triggers Level 2 Emergent or Level 3 Urgent', () => {
      // 103.1 °F = 39.5 °C -> Level 2 Emergent
      const highFeverF = evaluateClinicalRules({ temperature: 103.1 });
      expect(highFeverF.predicted_acuity).toBe(ACUITY_LEVELS.EMERGENT);

      // 39.5 °C -> Level 2 Emergent
      const highFeverC = evaluateClinicalRules({ temperature: 39.5 });
      expect(highFeverC.predicted_acuity).toBe(ACUITY_LEVELS.EMERGENT);

      // 101.3 °F = 38.5 °C -> Level 3 Urgent (38.2 <= temp < 39.5)
      const moderateFeverF = evaluateClinicalRules({ temperature: 101.3 });
      expect(moderateFeverF.predicted_acuity).toBe(ACUITY_LEVELS.URGENT);

      // 38.5 °C -> Level 3 Urgent
      const moderateFeverC = evaluateClinicalRules({ temperature: 38.5 });
      expect(moderateFeverC.predicted_acuity).toBe(ACUITY_LEVELS.URGENT);

      // 99.8 °F = 37.67 °C -> Level 4 Less Urgent (37.5 <= temp < 38.2)
      const lowFeverF = evaluateClinicalRules({ temperature: 99.8 });
      expect(lowFeverF.predicted_acuity).toBe(ACUITY_LEVELS.LESS_URGENT);
    });

    test('Severe vitals using contract field names correctly trigger Level 1 Immediate', () => {
      // Hypotension (sbp < 70) and severe hypoxia (o2sat < 85)
      const severeCombo = evaluateClinicalRules({ sbp: 60, o2sat: 82 });
      expect(severeCombo.predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // Hypoxia alone
      expect(evaluateClinicalRules({ o2sat: 84 }).predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // Extreme bradycardia (heartrate < 40)
      expect(evaluateClinicalRules({ heartrate: 35 }).predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // Extreme tachycardia (heartrate > 140)
      expect(evaluateClinicalRules({ heartrate: 155 }).predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // Severe respiratory depression (resprate < 8)
      expect(evaluateClinicalRules({ resprate: 6 }).predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // Severe tachypnea (resprate > 35)
      expect(evaluateClinicalRules({ resprate: 42 }).predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // Hypertensive crisis (sbp > 210)
      expect(evaluateClinicalRules({ sbp: 225 }).predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // Cardiac arrest chief complaint code (101)
      expect(evaluateClinicalRules({ chief_complaint_code: 101 }).predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);
    });

    test('Pain score severity escalation across ESI levels', () => {
      expect(evaluateClinicalRules({ pain: 10 }).predicted_acuity).toBe(ACUITY_LEVELS.EMERGENT); // 8-10 -> Emergent
      expect(evaluateClinicalRules({ pain: 8 }).predicted_acuity).toBe(ACUITY_LEVELS.EMERGENT);
      expect(evaluateClinicalRules({ pain: 7 }).predicted_acuity).toBe(ACUITY_LEVELS.URGENT);    // 5-7 -> Urgent
      expect(evaluateClinicalRules({ pain: 5 }).predicted_acuity).toBe(ACUITY_LEVELS.URGENT);
      expect(evaluateClinicalRules({ pain: 4 }).predicted_acuity).toBe(ACUITY_LEVELS.LESS_URGENT); // 3-4 -> Less Urgent
      expect(evaluateClinicalRules({ pain: 3 }).predicted_acuity).toBe(ACUITY_LEVELS.LESS_URGENT);
      expect(evaluateClinicalRules({ pain: 2 }).predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT); // 0-2 -> Non-urgent
      expect(evaluateClinicalRules({ pain: 0 }).predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
      expect(evaluateClinicalRules({ pain: null }).predicted_acuity).toBe(ACUITY_LEVELS.NON_URGENT);
    });

    test('Legacy snake_case and camelCase field aliases are properly resolved', () => {
      // Legacy snake_case
      const legacyResult = evaluateClinicalRules({
        systolic_bp: 60,
        spo2: 82,
        heart_rate: 150
      });
      expect(legacyResult.predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);

      // camelCase
      const camelResult = evaluateClinicalRules({
        systolicBp: 65,
        oxygenSaturation: 80,
        heartRate: 160
      });
      expect(camelResult.predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);
    });

    test('String numeric vitals are cleanly parsed without error', () => {
      const stringResult = evaluateClinicalRules({
        sbp: '60',
        o2sat: '82'
      });
      expect(stringResult.predicted_acuity).toBe(ACUITY_LEVELS.IMMEDIATE);
    });
  });

  describe('2. validateTriageInput: Extreme Valid & Invalid Input Stress Tests', () => {
    test('Valid intake with all fields populated with contract names passes cleanly', () => {
      const valid = {
        patient_id: dummyUUID,
        arrival_transport: 'AMBULANCE',
        arrival_time: new Date().toISOString(),
        temperature: 37.0,
        heartrate: 78,
        resprate: 18,
        o2sat: 98.0,
        sbp: 120,
        dbp: 80,
        pain: 4,
        chief_complaint_code: 1
      };

      const errors = validateTriageInput(valid);
      expect(errors).toHaveLength(0);
    });

    test('Valid intake with all vitals set to null passes cleanly', () => {
      const allNull = {
        patient_id: dummyUUID,
        arrival_transport: 'WALK IN',
        arrival_time: new Date().toISOString(),
        temperature: null,
        heartrate: null,
        resprate: null,
        o2sat: null,
        sbp: null,
        dbp: null,
        pain: null,
        chief_complaint_code: null
      };

      const errors = validateTriageInput(allNull);
      expect(errors).toHaveLength(0);
    });

    test('Valid intake with all vitals omitted passes cleanly', () => {
      const omitted = {
        patient_id: dummyUUID
      };

      const errors = validateTriageInput(omitted);
      expect(errors).toHaveLength(0);
    });

    test('Extreme valid vital boundaries pass validation', () => {
      // Minimum clinical boundaries
      const minBounds = {
        patient_id: dummyUUID,
        sbp: 40,
        dbp: 20,
        heartrate: 20,
        resprate: 4,
        o2sat: 50.0,
        temperature: 30.0, // min °C
        pain: 0
      };
      expect(validateTriageInput(minBounds)).toHaveLength(0);

      // Maximum clinical boundaries
      const maxBounds = {
        patient_id: dummyUUID,
        sbp: 300,
        dbp: 200,
        heartrate: 300,
        resprate: 80,
        o2sat: 100.0,
        temperature: 45.0, // max °C
        pain: 10
      };
      expect(validateTriageInput(maxBounds)).toHaveLength(0);

      // Fahrenheit temperature boundaries
      const minTempF = { patient_id: dummyUUID, temperature: 85.0 };
      expect(validateTriageInput(minTempF)).toHaveLength(0);

      const maxTempF = { patient_id: dummyUUID, temperature: 115.0 };
      expect(validateTriageInput(maxTempF)).toHaveLength(0);
    });

    test('Extreme invalid vital boundaries are strictly rejected', () => {
      // SBP out of bounds
      expect(validateTriageInput({ patient_id: dummyUUID, sbp: 39 }).some(e => e.field === 'sbp')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, sbp: 301 }).some(e => e.field === 'sbp')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, sbp: 120.5 }).some(e => e.field === 'sbp')).toBe(true); // float rejected

      // DBP out of bounds
      expect(validateTriageInput({ patient_id: dummyUUID, dbp: 19 }).some(e => e.field === 'dbp')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, dbp: 201 }).some(e => e.field === 'dbp')).toBe(true);

      // DBP >= SBP relational violation
      expect(validateTriageInput({ patient_id: dummyUUID, sbp: 120, dbp: 120 }).some(e => e.field === 'dbp')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, sbp: 100, dbp: 110 }).some(e => e.field === 'dbp')).toBe(true);

      // Heart rate out of bounds
      expect(validateTriageInput({ patient_id: dummyUUID, heartrate: 19 }).some(e => e.field === 'heartrate')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, heartrate: 301 }).some(e => e.field === 'heartrate')).toBe(true);

      // Respiratory rate out of bounds
      expect(validateTriageInput({ patient_id: dummyUUID, resprate: 3 }).some(e => e.field === 'resprate')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, resprate: 81 }).some(e => e.field === 'resprate')).toBe(true);

      // SpO2 out of bounds
      expect(validateTriageInput({ patient_id: dummyUUID, o2sat: 49.9 }).some(e => e.field === 'o2sat')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, o2sat: 100.1 }).some(e => e.field === 'o2sat')).toBe(true);

      // Temperature out of bounds (neither valid °C nor valid °F)
      expect(validateTriageInput({ patient_id: dummyUUID, temperature: 29.9 }).some(e => e.field === 'temperature')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, temperature: 48.0 }).some(e => e.field === 'temperature')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, temperature: 84.9 }).some(e => e.field === 'temperature')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, temperature: 115.5 }).some(e => e.field === 'temperature')).toBe(true);

      // Pain score out of bounds
      expect(validateTriageInput({ patient_id: dummyUUID, pain: -1 }).some(e => e.field === 'pain')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, pain: 11 }).some(e => e.field === 'pain')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, pain: 4.5 }).some(e => e.field === 'pain')).toBe(true); // float rejected
    });

    test('Patient ID validation handles malformed UUID, missing, and update modes', () => {
      // Missing patient_id on creation
      expect(validateTriageInput({}).some(e => e.field === 'patient_id')).toBe(true);
      // Malformed UUID
      expect(validateTriageInput({ patient_id: 'invalid-uuid-1234' }).some(e => e.field === 'patient_id')).toBe(true);
      // Valid UUID
      expect(validateTriageInput({ patient_id: dummyUUID }).some(e => e.field === 'patient_id')).toBe(false);

      // Update mode allows omitted patient_id
      expect(validateTriageInput({}, true).some(e => e.field === 'patient_id')).toBe(false);
      // Update mode rejects malformed patient_id if provided
      expect(validateTriageInput({ patient_id: 'not-valid' }, true).some(e => e.field === 'patient_id')).toBe(true);
    });

    test('Arrival transport enum validation and case handling', () => {
      VALID_ARRIVAL_TRANSPORTS.forEach(transport => {
        expect(validateTriageInput({ patient_id: dummyUUID, arrival_transport: transport })).toHaveLength(0);
        // Case-insensitive trimming
        expect(validateTriageInput({ patient_id: dummyUUID, arrival_transport: ` ${transport.toLowerCase()} ` })).toHaveLength(0);
      });

      // Invalid transport types
      expect(validateTriageInput({ patient_id: dummyUUID, arrival_transport: 'AIR_AMBULANCE' }).some(e => e.field === 'arrival_transport')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, arrival_transport: 'TAXI' }).some(e => e.field === 'arrival_transport')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, arrival_transport: 'PRIVATE CAR' }).some(e => e.field === 'arrival_transport')).toBe(true);
    });

    test('Arrival time ISO string validation', () => {
      // Valid ISO datetimes
      expect(validateTriageInput({ patient_id: dummyUUID, arrival_time: '2026-10-20T18:00:00.000Z' })).toHaveLength(0);
      expect(validateTriageInput({ patient_id: dummyUUID, arrival_time: '2026-10-20T18:00:00Z' })).toHaveLength(0);

      // Invalid datetime strings
      expect(validateTriageInput({ patient_id: dummyUUID, arrival_time: 'not-a-date' }).some(e => e.field === 'arrival_time')).toBe(true);
      expect(validateTriageInput({ patient_id: dummyUUID, arrival_time: '2026-13-45' }).some(e => e.field === 'arrival_time')).toBe(true);
    });
  });

  describe('3. GET /api/departments Endpoint Supertest Verification', () => {
    test('GET /api/departments returns 200 with standard 4 hospital departments and dynamic metrics', async () => {
      const res = await request(app).get('/api/departments');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(4);

      const deptNames = res.body.data.map(d => d.name);
      expect(deptNames).toContain('Emergency');
      expect(deptNames).toContain('Emergency / Critical Care');
      expect(deptNames).toContain('General Medical');
      expect(deptNames).toContain('Outpatient');

      res.body.data.forEach(dept => {
        expect(dept).toHaveProperty('id');
        expect(dept).toHaveProperty('name');
        expect(dept).toHaveProperty('code');
        expect(dept).toHaveProperty('capacity');
        expect(dept).toHaveProperty('averageWaitTime');
        expect(dept).toHaveProperty('status', 'Active');
        expect(dept).toHaveProperty('description');
        expect(typeof dept.currentQueueLength).toBe('number');
        expect(typeof dept.availableStaff).toBe('number');
      });
    });

    test('GET /api/departments/:id returns 200 for valid ID or name', async () => {
      // Lookup by ID
      const resId = await request(app).get('/api/departments/dept-1');
      expect(resId.status).toBe(200);
      expect(resId.body.data.name).toBe('Emergency');

      // Lookup by Name (case-insensitive)
      const resName = await request(app).get('/api/departments/emergency');
      expect(resName.status).toBe(200);
      expect(resName.body.data.id).toBe('dept-1');
    });

    test('GET /api/departments/:id returns 404 for unknown department', async () => {
      const res = await request(app).get('/api/departments/unknown-dept-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
