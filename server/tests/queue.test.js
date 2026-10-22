const { compareQueuePriority, computeQueuePositions } = require('../src/utils/queueUtils');
const { 
  ACUITY_LEVELS, 
  getDepartmentForAcuity, 
  getWaitingThresholdMinutes, 
  getAcuityPriority,
  normalizeAcuity 
} = require('../src/utils/acuityUtils');

describe('Clinical Priority Queue Algorithm Tests (5-Level ESI Standard)', () => {
  test('Correctly prioritizes higher acuity patients regardless of arrival time', () => {
    const earlyNonUrgent = {
      queue_id: '1',
      acuity_level: 'Non-urgent',
      queued_at: new Date('2026-01-01T10:00:00Z')
    };

    const lateImmediate = {
      queue_id: '2',
      acuity_level: 'Immediate',
      queued_at: new Date('2026-01-01T10:30:00Z')
    };

    const entries = [earlyNonUrgent, lateImmediate];
    entries.sort(compareQueuePriority);

    // Immediate must be placed before Non-urgent even though it arrived 30 mins later
    expect(entries[0].queue_id).toBe('2');
    expect(entries[1].queue_id).toBe('1');
  });

  test('Correctly applies FIFO ordering when acuity levels are identical', () => {
    const earlyUrgent = {
      queue_id: 'urg-1',
      acuity_level: 'Urgent',
      queued_at: new Date('2026-01-01T10:00:00Z')
    };

    const lateUrgent = {
      queue_id: 'urg-2',
      acuity_level: 'Urgent',
      queued_at: new Date('2026-01-01T10:15:00Z')
    };

    const entries = [lateUrgent, earlyUrgent];
    entries.sort(compareQueuePriority);

    // Same acuity: earlier arrival served first
    expect(entries[0].queue_id).toBe('urg-1');
    expect(entries[1].queue_id).toBe('urg-2');
  });

  test('Comprehensive 5-level ESI hierarchy: Immediate > Emergent > Urgent > Less Urgent > Non-urgent', () => {
    const pNonUrgent = { queue_id: 'non-urg', acuity_level: 'Non-urgent', queued_at: new Date('2026-01-01T08:00:00Z') };
    const pLessUrgent = { queue_id: 'less-urg', acuity_level: 'Less Urgent', queued_at: new Date('2026-01-01T08:05:00Z') };
    const pUrgent = { queue_id: 'urg', acuity_level: 'Urgent', queued_at: new Date('2026-01-01T08:10:00Z') };
    const pEmergent = { queue_id: 'emergent', acuity_level: 'Emergent', queued_at: new Date('2026-01-01T08:15:00Z') };
    const pImmediate = { queue_id: 'immediate', acuity_level: 'Immediate', queued_at: new Date('2026-01-01T08:20:00Z') };

    const entries = [pNonUrgent, pLessUrgent, pUrgent, pEmergent, pImmediate];
    const assignments = computeQueuePositions(entries);

    expect(assignments[0].queue_id).toBe('immediate');
    expect(assignments[0].queue_position).toBe(1);

    expect(assignments[1].queue_id).toBe('emergent');
    expect(assignments[1].queue_position).toBe(2);

    expect(assignments[2].queue_id).toBe('urg');
    expect(assignments[2].queue_position).toBe(3);

    expect(assignments[3].queue_id).toBe('less-urg');
    expect(assignments[3].queue_position).toBe(4);

    expect(assignments[4].queue_id).toBe('non-urg');
    expect(assignments[4].queue_position).toBe(5);
  });

  test('Backward compatibility: accurately maps legacy labels to 5-level hierarchy', () => {
    expect(normalizeAcuity('Critical')).toBe('Immediate');
    expect(normalizeAcuity('High')).toBe('Emergent');
    expect(normalizeAcuity('Moderate')).toBe('Urgent');
    expect(normalizeAcuity('Low')).toBe('Non-urgent');

    expect(getAcuityPriority('Critical')).toBe(1);
    expect(getAcuityPriority('High')).toBe(2);
    expect(getAcuityPriority('Moderate')).toBe(3);
    expect(getAcuityPriority('Low')).toBe(5);
  });

  test('Department routing correctly maps acuities to clinical departments', () => {
    expect(getDepartmentForAcuity('Immediate')).toBe('Emergency');
    expect(getDepartmentForAcuity('Emergent')).toBe('Emergency / Critical Care');
    expect(getDepartmentForAcuity('Urgent')).toBe('General Medical');
    expect(getDepartmentForAcuity('Less Urgent')).toBe('General Medical');
    expect(getDepartmentForAcuity('Non-urgent')).toBe('Outpatient');
  });

  test('Wait-time thresholds enforce shorter limits for higher acuity (ESI standards)', () => {
    expect(getWaitingThresholdMinutes('Immediate')).toBe(0);
    expect(getWaitingThresholdMinutes('Emergent')).toBe(10);
    expect(getWaitingThresholdMinutes('Urgent')).toBe(30);
    expect(getWaitingThresholdMinutes('Less Urgent')).toBe(60);
    expect(getWaitingThresholdMinutes('Non-urgent')).toBe(120);
  });
});
