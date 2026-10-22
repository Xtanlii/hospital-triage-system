const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const seed = require('../prisma/seed');

jest.setTimeout(60000);

describe('Doctor Shift Management & Department-Scoped Queue Tests', () => {
  let adminToken;
  let emergencyDoctorToken;
  let criticalCareDoctorToken;
  let emergencyDoctorId;
  let emergencyQueueId;
  let criticalCareQueueId;

  beforeAll(async () => {
    // Seed fresh database with doctors and 5-level patients
    await seed();

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.data.token;

    // Login Emergency Doctor (Dr. James Wilson)
    const doc1Login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'doctor.wilson', password: 'password123' });
    emergencyDoctorToken = doc1Login.body.data.token;
    emergencyDoctorId = doc1Login.body.data.user.user_id;

    // Login Critical Care Doctor (Dr. Lisa Cuddy)
    const doc2Login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'doctor.cuddy', password: 'password123' });
    criticalCareDoctorToken = doc2Login.body.data.token;

    // Find queue entries for testing
    const emergencyEntry = await prisma.queueEntry.findFirst({
      where: { department: 'Emergency' }
    });
    emergencyQueueId = emergencyEntry.queue_id;

    const criticalCareEntry = await prisma.queueEntry.findFirst({
      where: { department: 'Emergency / Critical Care' }
    });
    criticalCareQueueId = criticalCareEntry.queue_id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Active Doctor Counter & Shift Check-In / Check-Out', () => {
    test('Initial active doctors count reflects seeded on-duty doctors', async () => {
      const res = await request(app)
        .get('/api/doctor/active')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalDoctors).toBe(4);
      expect(res.body.data.activeCount).toBe(2); // Wilson & Cuddy
      expect(res.body.data.byDepartment['Emergency']).toBe(1);
      expect(res.body.data.byDepartment['Emergency / Critical Care']).toBe(1);
    });

    test('Doctor check-out reduces active doctors count immediately', async () => {
      const checkOutRes = await request(app)
        .post('/api/doctor/check-out')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(checkOutRes.status).toBe(200);
      expect(checkOutRes.body.data.doctor.is_on_duty).toBe(false);
      expect(checkOutRes.body.data.activeDoctorsCount).toBe(1); // Dropped from 2 to 1

      // Verify active endpoint also reports 1
      const activeRes = await request(app)
        .get('/api/doctor/active')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(activeRes.body.data.activeCount).toBe(1);
      expect(activeRes.body.data.byDepartment['Emergency']).toBeUndefined();
    });

    test('Doctor check-in restores on-duty status and increases active doctor count', async () => {
      const checkInRes = await request(app)
        .post('/api/doctor/check-in')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(checkInRes.status).toBe(200);
      expect(checkInRes.body.data.doctor.is_on_duty).toBe(true);
      expect(checkInRes.body.data.activeDoctorsCount).toBe(2); // Restored back to 2
    });

    test('Doctor toggle duty status toggles between active and inactive', async () => {
      // Toggle off
      const toggleOffRes = await request(app)
        .patch('/api/doctor/duty-status')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(toggleOffRes.status).toBe(200);
      expect(toggleOffRes.body.data.doctor.is_on_duty).toBe(false);
      expect(toggleOffRes.body.data.activeDoctorsCount).toBe(1);

      // Toggle back on
      const toggleOnRes = await request(app)
        .patch('/api/doctor/duty-status')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(toggleOnRes.status).toBe(200);
      expect(toggleOnRes.body.data.doctor.is_on_duty).toBe(true);
      expect(toggleOnRes.body.data.activeDoctorsCount).toBe(2);
    });
  });

  describe('2. Department Scoped Queues Enforcement', () => {
    test('Emergency Doctor ONLY sees patients in the Emergency department queue', async () => {
      const res = await request(app)
        .get('/api/queue')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      // Every single returned queue entry MUST be Emergency
      for (const entry of res.body.data) {
        expect(entry.department).toBe('Emergency');
      }
    });

    test('Emergency Doctor cannot override filter to view another department queue', async () => {
      const res = await request(app)
        .get('/api/queue?department=General Medical')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(res.status).toBe(200);
      // Department override MUST be ignored; results must still be strictly Emergency
      for (const entry of res.body.data) {
        expect(entry.department).toBe('Emergency');
      }
    });

    test('getMyDepartmentQueue endpoint returns exclusively doctor department queue', async () => {
      const res = await request(app)
        .get('/api/doctor/my-queue')
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.department).toBe('Emergency');
      for (const entry of res.body.data.entries) {
        expect(entry.department).toBe('Emergency');
      }
    });

    test('Doctor CAN attend patients in their own department', async () => {
      const res = await request(app)
        .patch(`/api/queue/${emergencyQueueId}/attend`)
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Completed');
    });

    test('Doctor CANNOT attend or manage patients in a different department (403 Forbidden)', async () => {
      // Emergency doctor tries to attend Critical Care patient
      const res = await request(app)
        .patch(`/api/queue/${criticalCareQueueId}/attend`)
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only attend patients within your assigned department/i);
    });

    test('Doctor CANNOT view details of a patient from another department (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/queue/${criticalCareQueueId}`)
        .set('Authorization', `Bearer ${emergencyDoctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only view patients within your assigned department/i);
    });
  });
});
