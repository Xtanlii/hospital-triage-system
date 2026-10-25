const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const seed = require('../prisma/seed');
const cacheService = require('../src/services/cacheService');
const { evaluateClinicalRules } = require('../src/utils/clinicalRuleEngine');
const { predictAcuity } = require('../src/services/mlService');

jest.setTimeout(60000);

describe('Network Failure Mechanisms & Offline Fallback Tests', () => {
  let adminToken;
  let nurseToken;
  let testPatientId;

  beforeAll(async () => {
    await seed();

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminRes.body.data.token;

    // Login Nurse Sarah
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nurse.sarah', password: 'password123' });
    nurseToken = loginRes.body.data.token;

    // Get a patient for triage
    const patient = await prisma.patient.findFirst({
      where: { first_name: 'Chukwudi' }
    });
    testPatientId = patient.patient_id;
  });

  afterAll(async () => {
    await cacheService.flush();
    await prisma.$disconnect();
  });

  describe('1. Clinical ESI Decision Tree (Offline Fallback Engine)', () => {
    test('Correctly classifies life-threatening vitals as Level 1: Immediate', () => {
      const result = evaluateClinicalRules({
        systolic_bp: 60, // severe hypotension
        diastolic_bp: 40,
        heart_rate: 150, // extreme tachycardia
        respiratory_rate: 38,
        spo2: 82, // severe hypoxia
        temperature: 37.0,
        pain_score: 9,
        chief_complaint_code: 101
      });

      expect(result.predicted_acuity).toBe('Immediate');
      expect(result.is_offline_fallback).toBe(true);
      expect(result.model_used).toMatch(/Clinical ESI Rule Engine/);
    });

    test('Correctly classifies high-risk emergency as Level 2: Emergent', () => {
      const result = evaluateClinicalRules({
        systolic_bp: 145,
        diastolic_bp: 95,
        heart_rate: 120, // danger zone
        respiratory_rate: 30,
        spo2: 89, // hypoxia
        temperature: 38.5,
        pain_score: 8, // severe pain
        chief_complaint_code: 204
      });

      expect(result.predicted_acuity).toBe('Emergent');
      expect(result.is_offline_fallback).toBe(true);
    });

    test('Correctly classifies moderate case as Level 3: Urgent', () => {
      const result = evaluateClinicalRules({
        systolic_bp: 135,
        diastolic_bp: 85,
        heart_rate: 105,
        respiratory_rate: 24,
        spo2: 93,
        temperature: 38.6,
        pain_score: 6,
        chief_complaint_code: 301
      });

      expect(result.predicted_acuity).toBe('Urgent');
      expect(result.is_offline_fallback).toBe(true);
    });

    test('Correctly classifies stable mild case as Level 4: Less Urgent', () => {
      const result = evaluateClinicalRules({
        systolic_bp: 132,
        diastolic_bp: 82,
        heart_rate: 92,
        respiratory_rate: 18,
        spo2: 97,
        temperature: 37.6,
        pain_score: 3,
        chief_complaint_code: 402
      });

      expect(result.predicted_acuity).toBe('Less Urgent');
      expect(result.is_offline_fallback).toBe(true);
    });

    test('Correctly classifies completely stable normal case as Level 5: Non-urgent', () => {
      const result = evaluateClinicalRules({
        systolic_bp: 118,
        diastolic_bp: 75,
        heart_rate: 72,
        respiratory_rate: 15,
        spo2: 99,
        temperature: 36.6,
        pain_score: 1,
        chief_complaint_code: 405
      });

      expect(result.predicted_acuity).toBe('Non-urgent');
      expect(result.is_offline_fallback).toBe(true);
    });
  });

  describe('2. End-to-End Triage when ML Service is Offline', () => {
    test('Completes triage successfully via offline fallback when external ML is down', async () => {
      // The ML_SERVICE_URL points to port 8000 (which is offline during tests)
      const triagePayload = {
        patient_id: testPatientId,
        systolic_bp: 185,
        diastolic_bp: 110,
        heart_rate: 130,
        respiratory_rate: 30,
        spo2: 89.0,
        temperature: 38.2,
        pain_score: 8,
        chief_complaint_code: 204
      };

      const res = await request(app)
        .post('/api/triage')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send(triagePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prediction.predicted_acuity).toBe('Emergent');
      expect(res.body.data.prediction.model_used).toMatch(/Clinical ESI Rule Engine \(Offline Fallback\)/);
      expect(res.body.data.queueEntry).toBeDefined();
      expect(res.body.data.queueEntry.status).toBe('Waiting');
    });
  });

  describe('3. Server-Side Caching (Redis / In-Memory Fallback)', () => {
    test('Cache operations (set, get, del, delPattern) work reliably', async () => {
      await cacheService.set('test:key', { name: 'Hospital Triage' }, 10);
      const val = await cacheService.get('test:key');
      expect(val).toEqual({ name: 'Hospital Triage' });

      await cacheService.del('test:key');
      const deletedVal = await cacheService.get('test:key');
      expect(deletedVal).toBeNull();
    });

    test('Pattern invalidation clears all prefixed keys', async () => {
      await cacheService.set('queue:test:1', { id: 1 }, 10);
      await cacheService.set('queue:test:2', { id: 2 }, 10);
      await cacheService.set('other:key', { id: 3 }, 10);

      await cacheService.delPattern('queue:*');

      expect(await cacheService.get('queue:test:1')).toBeNull();
      expect(await cacheService.get('queue:test:2')).toBeNull();
      expect(await cacheService.get('other:key')).toEqual({ id: 3 });
    });

    test('Admin dashboard serves cached response on repeated request', async () => {
      // First call: calculates and sets cache
      const res1 = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.status).toBe(200);

      // Second call: served from cache
      const res2 = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.message).toMatch(/Cached/);
      expect(res2.body.data.summary.totalWaiting).toBe(res1.body.data.summary.totalWaiting);
    });
  });
});
