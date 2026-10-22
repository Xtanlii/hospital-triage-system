/**
 * Automated Acceptance & Stress Test Suite: ML Contract Compliance
 * Tests formatMLPayload, predictAcuity integer 1-5 parsing, acuity color mapping,
 * Celsius-to-Fahrenheit conversion, strict null preservation, and offline fallback.
 */

const { formatMLPayload, predictAcuity } = require('../src/services/mlService');
const {
  ACUITY_LEVELS,
  ACUITY_COLORS,
  normalizeAcuity,
  getAcuityColor,
  isValidAcuity
} = require('../src/utils/acuityUtils');
const { evaluateClinicalRules } = require('../src/utils/clinicalRuleEngine');

describe('ML Contract & Acuity Mapping Test Suite', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    if (global.fetch && global.fetch.mockRestore) {
      global.fetch.mockRestore();
    } else {
      global.fetch = originalFetch;
    }
  });

  describe('1. Documented Fields & Payload Integrity (formatMLPayload)', () => {
    const DOCUMENTED_KEYS = [
      'temperature',
      'heartrate',
      'resprate',
      'o2sat',
      'sbp',
      'dbp',
      'pain',
      'gender',
      'arrival_transport',
      'arrival_time'
    ];

    test('Strictly produces all 10 documented fields and no extraneous keys', () => {
      const payload = formatMLPayload({
        temperature: 37.0,
        temperature_unit: 'C',
        heartrate: 80,
        resprate: 18,
        o2sat: 98,
        sbp: 120,
        dbp: 80,
        pain: 3,
        gender: 'F',
        arrival_transport: 'AMBULANCE',
        arrival_time: '2026-10-20T16:00:00.000Z',
        unwanted_field: 'should_not_exist',
        extra_data: 12345
      });

      const keys = Object.keys(payload);
      expect(keys.length).toBe(10);
      DOCUMENTED_KEYS.forEach(key => {
        expect(keys).toContain(key);
      });
      expect(payload.unwanted_field).toBeUndefined();
      expect(payload.extra_data).toBeUndefined();
    });

    test('Serializes to JSON with all 10 keys explicitly present even when vitals are null/uncollected', () => {
      const emptyPayload = formatMLPayload({});
      const jsonString = JSON.stringify(emptyPayload);
      const deserialized = JSON.parse(jsonString);

      expect(Object.keys(deserialized).length).toBe(10);
      DOCUMENTED_KEYS.forEach(key => {
        expect(deserialized).toHaveProperty(key);
      });

      // Strict nulls for uncollected vitals (not undefined, not omitted, not NaN, not 0)
      expect(deserialized.temperature).toBeNull();
      expect(deserialized.heartrate).toBeNull();
      expect(deserialized.resprate).toBeNull();
      expect(deserialized.o2sat).toBeNull();
      expect(deserialized.sbp).toBeNull();
      expect(deserialized.dbp).toBeNull();
      expect(deserialized.pain).toBeNull();

      // Sensible defaults for categoricals and timestamps
      expect(deserialized.gender).toBe('M');
      expect(deserialized.arrival_transport).toBe('UNKNOWN');
      expect(typeof deserialized.arrival_time).toBe('string');
      expect(new Date(deserialized.arrival_time).getTime()).not.toBeNaN();
    });

    test('Correctly maps legacy alias field names to model contract names', () => {
      const payload = formatMLPayload({
        systolic_bp: 130,
        diastolic_bp: 85,
        heart_rate: 76,
        respiratory_rate: 16,
        spo2: 99,
        pain_score: 5,
        temperature: 36.8
      });

      expect(payload.sbp).toBe(130);
      expect(payload.dbp).toBe(85);
      expect(payload.heartrate).toBe(76);
      expect(payload.resprate).toBe(16);
      expect(payload.o2sat).toBe(99);
      expect(payload.pain).toBe(5);
      expect(payload.temperature).toBe(98.2);
    });

    test('Preserves numeric 0 for vitals and pain (0 pain is valid no-pain, not null)', () => {
      const payload = formatMLPayload({
        pain: 0,
        pain_score: 0,
        sbp: 0,
        dbp: 0,
        heartrate: 0
      });

      expect(payload.pain).toBe(0);
      expect(payload.sbp).toBe(0);
      expect(payload.dbp).toBe(0);
      expect(payload.heartrate).toBe(0);
    });

    test('Normalizes gender strictly to "M" or "F"', () => {
      expect(formatMLPayload({ gender: 'Female' }).gender).toBe('F');
      expect(formatMLPayload({ gender: 'female' }).gender).toBe('F');
      expect(formatMLPayload({ gender: 'F' }).gender).toBe('F');
      expect(formatMLPayload({ gender: 'Male' }).gender).toBe('M');
      expect(formatMLPayload({ gender: 'male' }).gender).toBe('M');
      expect(formatMLPayload({ gender: 'M' }).gender).toBe('M');
      expect(formatMLPayload({ gender: null }).gender).toBe('M');
      expect(formatMLPayload({ gender: undefined }).gender).toBe('M');
    });

    test('Normalizes arrival_transport to exact enum values', () => {
      const validEnums = ['AMBULANCE', 'WALK IN', 'HELICOPTER', 'OTHER', 'UNKNOWN'];
      validEnums.forEach(transport => {
        expect(formatMLPayload({ arrival_transport: transport }).arrival_transport).toBe(transport);
        expect(formatMLPayload({ arrival_transport: transport.toLowerCase() }).arrival_transport).toBe(transport);
      });

      // Hyphen conversion
      expect(formatMLPayload({ arrival_transport: 'WALK-IN' }).arrival_transport).toBe('WALK IN');

      // Unrecognized falls back to UNKNOWN
      expect(formatMLPayload({ arrival_transport: 'CAR' }).arrival_transport).toBe('UNKNOWN');
      expect(formatMLPayload({ arrival_transport: null }).arrival_transport).toBe('UNKNOWN');
      expect(formatMLPayload({ arrival_transport: '' }).arrival_transport).toBe('UNKNOWN');
    });

    test('Preserves valid ISO arrival_time string or defaults to valid ISO', () => {
      const specificTime = '2026-10-20T14:30:00.000Z';
      expect(formatMLPayload({ arrival_time: specificTime }).arrival_time).toBe(specificTime);

      const generated = formatMLPayload({}).arrival_time;
      expect(new Date(generated).toISOString()).toBe(generated);
    });
  });

  describe('2. Temperature Conversion & Fahrenheit Formatting', () => {
    test('Converts 37.0 °C to 98.6 °F', () => {
      const p1 = formatMLPayload({ temperature: 37.0, temperature_unit: 'C' });
      expect(p1.temperature).toBe(98.6);

      const p2 = formatMLPayload({ temperature: 37.0 });
      expect(p2.temperature).toBe(98.6);
    });

    test('Converts 36.5 °C to 97.7 °F', () => {
      const payload = formatMLPayload({ temperature: 36.5, temperature_unit: 'C' });
      expect(payload.temperature).toBe(97.7);
    });

    test('Converts 38.5 °C to 101.3 °F and 39.0 °C to 102.2 °F', () => {
      expect(formatMLPayload({ temperature: 38.5, temperature_unit: 'C' }).temperature).toBe(101.3);
      expect(formatMLPayload({ temperature: 39.0, temperature_unit: 'C' }).temperature).toBe(102.2);
    });

    test('Fahrenheit passthrough when temperature_unit is "F"', () => {
      const payload = formatMLPayload({ temperature: 98.6, temperature_unit: 'F' });
      expect(payload.temperature).toBe(98.6);

      const fever = formatMLPayload({ temperature: 101.4, temperature_unit: 'F' });
      expect(fever.temperature).toBe(101.4);
    });

    test('Fahrenheit passthrough heuristic when num > 60 even if unit defaulted to C', () => {
      // Prevents catastrophic double-conversion (98.6 °C would be 209.5 °F)
      const payload = formatMLPayload({ temperature: 98.6, temperature_unit: 'C' });
      expect(payload.temperature).toBe(98.6);

      const payloadUnspecified = formatMLPayload({ temperature: 99.2 });
      expect(payloadUnspecified.temperature).toBe(99.2);
    });

    test('Returns null when temperature is uncollected (null, undefined, empty string)', () => {
      expect(formatMLPayload({ temperature: null }).temperature).toBeNull();
      expect(formatMLPayload({ temperature: undefined }).temperature).toBeNull();
      expect(formatMLPayload({ temperature: '' }).temperature).toBeNull();
      expect(formatMLPayload({ temperature: 'invalid' }).temperature).toBeNull();
    });
  });

  describe('3. Acuity Normalization and Color Mapping (acuityUtils)', () => {
    test('Maps integer 1..5 to correct ESI levels and colors', () => {
      const expectations = [
        { level: 1, name: 'Immediate', color: 'Red' },
        { level: 2, name: 'Emergent', color: 'Orange' },
        { level: 3, name: 'Urgent', color: 'Yellow' },
        { level: 4, name: 'Less Urgent', color: 'Green' },
        { level: 5, name: 'Non-urgent', color: 'Blue' }
      ];

      expectations.forEach(({ level, name, color }) => {
        expect(normalizeAcuity(level)).toBe(name);
        expect(getAcuityColor(level)).toBe(color);
        expect(getAcuityColor(name)).toBe(color);
      });
    });

    test('Maps string representations "1".."5" to correct ESI levels and colors', () => {
      expect(normalizeAcuity('1')).toBe('Immediate');
      expect(getAcuityColor('1')).toBe('Red');

      expect(normalizeAcuity('2')).toBe('Emergent');
      expect(getAcuityColor('2')).toBe('Orange');

      expect(normalizeAcuity('3')).toBe('Urgent');
      expect(getAcuityColor('3')).toBe('Yellow');

      expect(normalizeAcuity('4')).toBe('Less Urgent');
      expect(getAcuityColor('4')).toBe('Green');

      expect(normalizeAcuity('5')).toBe('Non-urgent');
      expect(getAcuityColor('5')).toBe('Blue');
    });

    test('Validates acuity tokens strictly with isValidAcuity', () => {
      [1, 2, 3, 4, 5, '1', '2', '3', '4', '5'].forEach(token => {
        expect(isValidAcuity(token)).toBe(true);
      });

      ['Immediate', 'Emergent', 'Urgent', 'Less Urgent', 'Non-urgent'].forEach(token => {
        expect(isValidAcuity(token)).toBe(true);
      });

      [0, 6, -1, '0', '6', 'critical_fail', null, undefined, '', {}].forEach(token => {
        expect(isValidAcuity(token)).toBe(false);
      });
    });
  });

  describe('4. Online Prediction Response Parsing (predictAcuity)', () => {
    const testFeatures = {
      temperature: 37.0,
      heartrate: 75,
      resprate: 16,
      o2sat: 98,
      sbp: 120,
      dbp: 80,
      pain: 2,
      gender: 'M',
      arrival_transport: 'WALK IN'
    };

    test.each([
      [1, 'Immediate', 'Red'],
      [2, 'Emergent', 'Orange'],
      [3, 'Urgent', 'Yellow'],
      [4, 'Less Urgent', 'Green'],
      [5, 'Non-urgent', 'Blue']
    ])('Correctly parses raw integer %i -> %s / %s', async (inputInt, expectedAcuity, expectedColor) => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => inputInt
      });

      const result = await predictAcuity(testFeatures);

      expect(result.predicted_acuity).toBe(expectedAcuity);
      expect(result.acuity_color).toBe(expectedColor);
      expect(result.is_offline_fallback).toBe(false);
      expect(result.confidence_score).toBe(0.85); // Default confidence when omitted
    });

    test.each([
      [{ prediction: 1 }, 'Immediate', 'Red'],
      [{ prediction: 2 }, 'Emergent', 'Orange'],
      [{ prediction: 3 }, 'Urgent', 'Yellow'],
      [{ prediction: 4 }, 'Less Urgent', 'Green'],
      [{ prediction: 5 }, 'Non-urgent', 'Blue']
    ])('Correctly parses object %j -> %s / %s', async (obj, expectedAcuity, expectedColor) => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => obj
      });

      const result = await predictAcuity(testFeatures);

      expect(result.predicted_acuity).toBe(expectedAcuity);
      expect(result.acuity_color).toBe(expectedColor);
      expect(result.is_offline_fallback).toBe(false);
    });

    test('Correctly parses object with predicted_acuity, confidence_score, and model_used', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          predicted_acuity: 3,
          confidence_score: 0.93,
          model_used: 'XGBoost-MIMIC-ED-v1'
        })
      });

      const result = await predictAcuity(testFeatures);

      expect(result.predicted_acuity).toBe('Urgent');
      expect(result.acuity_color).toBe('Yellow');
      expect(result.confidence_score).toBe(0.93);
      expect(result.model_used).toBe('XGBoost-MIMIC-ED-v1');
      expect(result.is_offline_fallback).toBe(false);
    });

    test('Correctly parses array format [3] and string "3"', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [4]
      });

      const arrResult = await predictAcuity(testFeatures);
      expect(arrResult.predicted_acuity).toBe('Less Urgent');
      expect(arrResult.acuity_color).toBe('Green');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => '5'
      });

      const strResult = await predictAcuity(testFeatures);
      expect(strResult.predicted_acuity).toBe('Non-urgent');
      expect(strResult.acuity_color).toBe('Blue');
    });

    test('Normalizes percentage confidence (e.g. 95) to 0.95', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          prediction: 2,
          confidence: 95
        })
      });

      const result = await predictAcuity(testFeatures);
      expect(result.confidence_score).toBe(0.95);
    });

    test('Correctly parses exact Flask model_service response (acuity, triage_label, probabilities, manual_assessment_recommended)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          acuity: 1,
          triage_label: 'Red',
          probabilities: { '1': 0.9213, '2': 0.0714, '3': 0.007, '4': 0.0003, '5': 0.0 },
          manual_assessment_recommended: true,
          missing_fields: ['temperature', 'resprate', 'sbp', 'dbp', 'pain'],
          ignored_out_of_range: []
        })
      });

      const result = await predictAcuity({
        heartrate: 128,
        o2sat: 89,
        gender: 'F',
        arrival_transport: 'AMBULANCE'
      });

      expect(result.acuity).toBe(1);
      expect(result.predicted_acuity).toBe('Immediate');
      expect(result.acuity_color).toBe('Red');
      expect(result.triage_label).toBe('Red');
      expect(result.manual_assessment_recommended).toBe(true);
      expect(result.missing_fields).toEqual(['temperature', 'resprate', 'sbp', 'dbp', 'pain']);
      expect(result.probabilities['1']).toBe(0.9213);
      expect(result.confidence_score).toBe(0.9213);
      expect(result.is_offline_fallback).toBe(false);
    });
  });

  describe('5. Fallback Resilience on Invalid Responses & Failures', () => {
    test('Activates offline fallback when ML service returns out-of-range integer (e.g. 6)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => 6
      });

      const result = await predictAcuity({
        sbp: 120,
        heartrate: 72,
        resprate: 16,
        o2sat: 98,
        temperature: 36.6,
        pain: 1
      });

      expect(result.is_offline_fallback).toBe(true);
      expect(result.predicted_acuity).toBe('Non-urgent');
      expect(result.acuity_color).toBe('Blue');
    });

    test('Activates offline fallback on HTTP 500 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const result = await predictAcuity({
        sbp: 60,
        o2sat: 82
      });

      expect(result.is_offline_fallback).toBe(true);
      expect(result.predicted_acuity).toBe('Immediate');
      expect(result.acuity_color).toBe('Red');
    });

    test('Activates offline fallback on network exception (ECONNREFUSED / timeout)', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:8000'));

      const result = await predictAcuity({
        sbp: 145,
        heartrate: 120,
        pain: 8
      });

      expect(result.is_offline_fallback).toBe(true);
      expect(result.predicted_acuity).toBe('Emergent');
      expect(result.acuity_color).toBe('Orange');
    });

    test('Activates offline fallback on malformed JSON response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Unexpected token < in JSON');
        }
      });

      const result = await predictAcuity({
        sbp: 120,
        heartrate: 70
      });

      expect(result.is_offline_fallback).toBe(true);
      expect(result.acuity_color).toBeDefined();
    });

    test('Fallback with all vitals null safely resolves to Non-urgent / Blue (NO false Level 1)', () => {
      const fallbackResult = evaluateClinicalRules({
        temperature: null,
        heartrate: null,
        resprate: null,
        o2sat: null,
        sbp: null,
        dbp: null,
        pain: null
      });

      expect(fallbackResult.predicted_acuity).toBe('Non-urgent');
      expect(getAcuityColor(fallbackResult.predicted_acuity)).toBe('Blue');
    });

    test('Fallback with Fahrenheit normal temp (98.6) safely resolves to Non-urgent (NO false Level 2)', () => {
      const fallbackResult = evaluateClinicalRules({
        temperature: 98.6,
        heartrate: 75,
        sbp: 120,
        dbp: 80,
        o2sat: 98,
        pain: 0
      });

      expect(fallbackResult.predicted_acuity).toBe('Non-urgent');
      expect(getAcuityColor(fallbackResult.predicted_acuity)).toBe('Blue');
    });
  });

  describe('6. Stress Harness & Generator Verification', () => {
    test('Handles 100 randomized payloads without throwing or omitting documented keys', () => {
      const transports = ['AMBULANCE', 'WALK IN', 'HELICOPTER', 'OTHER', 'UNKNOWN', null, undefined, ''];
      const genders = ['M', 'F', 'Male', 'Female', null, undefined, ''];

      for (let i = 0; i < 100; i++) {
        const randomVitals = {
          temperature: Math.random() > 0.3 ? 35 + Math.random() * 6 : null,
          temperature_unit: Math.random() > 0.5 ? 'C' : 'F',
          heartrate: Math.random() > 0.3 ? Math.floor(40 + Math.random() * 120) : null,
          resprate: Math.random() > 0.3 ? Math.floor(10 + Math.random() * 30) : null,
          o2sat: Math.random() > 0.3 ? Math.floor(80 + Math.random() * 20) : null,
          sbp: Math.random() > 0.3 ? Math.floor(70 + Math.random() * 100) : null,
          dbp: Math.random() > 0.3 ? Math.floor(40 + Math.random() * 60) : null,
          pain: Math.random() > 0.3 ? Math.floor(Math.random() * 11) : null,
          gender: genders[Math.floor(Math.random() * genders.length)],
          arrival_transport: transports[Math.floor(Math.random() * transports.length)],
          arrival_time: Math.random() > 0.5 ? new Date().toISOString() : null,
          extraField: 'fuzz_' + i
        };

        const payload = formatMLPayload(randomVitals);
        const serialized = JSON.stringify(payload);
        const parsed = JSON.parse(serialized);

        expect(Object.keys(parsed).length).toBe(10);
        expect(parsed.extraField).toBeUndefined();
        expect(['M', 'F']).toContain(parsed.gender);
        expect(['AMBULANCE', 'WALK IN', 'HELICOPTER', 'OTHER', 'UNKNOWN']).toContain(parsed.arrival_transport);
        expect(typeof parsed.arrival_time).toBe('string');
      }
    });
  });
});
