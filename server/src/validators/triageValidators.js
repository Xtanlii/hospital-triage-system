const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_ARRIVAL_TRANSPORTS = [
  'AMBULANCE',
  'WALK IN',
  'HELICOPTER',
  'OTHER',
  'UNKNOWN'
];

/**
 * Validates triage intake payload.
 * Supports nullable/optional vital signs (unconscious or uncollected intake),
 * pain score nullable (unreportable pain), optional chief_complaint_code,
 * temperature in either Celsius (30.0–45.0 °C) or Fahrenheit (85.0–115.0 °F),
 * arrival_transport enum validation, and optional ISO arrival_time.
 * Supports both contract field names (sbp, dbp, heartrate, resprate, o2sat, pain)
 * and legacy aliases.
 * 
 * @param {Object} body Request body
 * @param {boolean} [isUpdate=false] Whether this is an update request
 * @returns {Array<Object>} Array of error objects { field, message }
 */
function validateTriageInput(body, isUpdate = false) {
  const errors = [];
  const b = body || {};

  const {
    patient_id
  } = b;

  // Patient ID validation
  if (!isUpdate) {
    if (!patient_id || !UUID_REGEX.test(patient_id)) {
      errors.push({ field: 'patient_id', message: 'Valid patient UUID is required' });
    }
  } else if (patient_id !== undefined && !UUID_REGEX.test(patient_id)) {
    errors.push({ field: 'patient_id', message: 'Valid patient UUID is required' });
  }

  // Systolic BP: nullable/optional, 40 - 300 mmHg
  const sbpKey = b.sbp !== undefined ? 'sbp' : 'systolic_bp';
  const rawSbp = b.sbp !== undefined ? b.sbp : b.systolic_bp;
  let sBp = null;
  if (rawSbp !== undefined && rawSbp !== null && rawSbp !== '') {
    sBp = Number(rawSbp);
    if (isNaN(sBp) || !Number.isInteger(sBp) || sBp < 40 || sBp > 300) {
      errors.push({ field: sbpKey, message: 'Systolic blood pressure must be an integer between 40 and 300 mmHg' });
    }
  }

  // Diastolic BP: nullable/optional, 20 - 200 mmHg, must be < systolic BP if both present
  const dbpKey = b.dbp !== undefined ? 'dbp' : 'diastolic_bp';
  const rawDbp = b.dbp !== undefined ? b.dbp : b.diastolic_bp;
  if (rawDbp !== undefined && rawDbp !== null && rawDbp !== '') {
    const dBp = Number(rawDbp);
    if (isNaN(dBp) || !Number.isInteger(dBp) || dBp < 20 || dBp > 200) {
      errors.push({ field: dbpKey, message: 'Diastolic blood pressure must be an integer between 20 and 200 mmHg' });
    } else if (sBp !== null && !isNaN(sBp) && dBp >= sBp) {
      errors.push({ field: dbpKey, message: 'Diastolic BP must be less than systolic BP' });
    }
  }

  // Heart Rate: nullable/optional, 20 - 300 bpm
  const hrKey = b.heartrate !== undefined ? 'heartrate' : 'heart_rate';
  const rawHr = b.heartrate !== undefined ? b.heartrate : b.heart_rate;
  if (rawHr !== undefined && rawHr !== null && rawHr !== '') {
    const hr = Number(rawHr);
    if (isNaN(hr) || !Number.isInteger(hr) || hr < 20 || hr > 300) {
      errors.push({ field: hrKey, message: 'Heart rate must be an integer between 20 and 300 bpm' });
    }
  }

  // Respiratory Rate: nullable/optional, 4 - 80 breaths/min
  const rrKey = b.resprate !== undefined ? 'resprate' : 'respiratory_rate';
  const rawRr = b.resprate !== undefined ? b.resprate : b.respiratory_rate;
  if (rawRr !== undefined && rawRr !== null && rawRr !== '') {
    const rr = Number(rawRr);
    if (isNaN(rr) || !Number.isInteger(rr) || rr < 4 || rr > 80) {
      errors.push({ field: rrKey, message: 'Respiratory rate must be an integer between 4 and 80 breaths/min' });
    }
  }

  // SpO2: nullable/optional, 50 - 100%
  const spo2Key = b.o2sat !== undefined ? 'o2sat' : 'spo2';
  const rawSpo2 = b.o2sat !== undefined ? b.o2sat : b.spo2;
  if (rawSpo2 !== undefined && rawSpo2 !== null && rawSpo2 !== '') {
    const o2 = Number(rawSpo2);
    if (isNaN(o2) || o2 < 50 || o2 > 100) {
      errors.push({ field: spo2Key, message: 'Oxygen saturation (SpO2) must be a numeric value between 50 and 100%' });
    }
  }

  // Temperature: nullable/optional, accepts 30.0 - 45.0 °C or 85.0 - 115.0 °F
  const rawTemp = b.temperature !== undefined ? b.temperature : b.temp;
  if (rawTemp !== undefined && rawTemp !== null && rawTemp !== '') {
    const temp = Number(rawTemp);
    const isCelsius = !isNaN(temp) && temp >= 30.0 && temp <= 45.0;
    const isFahrenheit = !isNaN(temp) && temp >= 85.0 && temp <= 115.0;
    if (!isCelsius && !isFahrenheit) {
      errors.push({
        field: 'temperature',
        message: 'Temperature must be a numeric value between 30.0 and 45.0 °C or 85.0 and 115.0 °F'
      });
    }
  }

  // Pain Score: nullable/optional, 0 - 10 integer
  const painKey = b.pain !== undefined ? 'pain' : 'pain_score';
  const rawPain = b.pain !== undefined ? b.pain : b.pain_score;
  if (rawPain !== undefined && rawPain !== null && rawPain !== '') {
    const pain = Number(rawPain);
    if (isNaN(pain) || !Number.isInteger(pain) || pain < 0 || pain > 10) {
      errors.push({ field: painKey, message: 'Pain score must be an integer between 0 and 10' });
    }
  }

  // Chief Complaint Code: nullable/optional, positive integer
  const rawCc = b.chief_complaint_code !== undefined ? b.chief_complaint_code : b.chiefComplaintCode;
  if (rawCc !== undefined && rawCc !== null && rawCc !== '') {
    const cc = Number(rawCc);
    if (isNaN(cc) || !Number.isInteger(cc) || cc <= 0) {
      errors.push({ field: 'chief_complaint_code', message: 'Chief complaint code must be a valid positive integer' });
    }
  }

  // Arrival Transport: nullable/optional, enum check
  const transportKey = b.arrival_transport !== undefined ? 'arrival_transport' : 'arrivalTransport';
  const rawTransport = b.arrival_transport !== undefined ? b.arrival_transport : b.arrivalTransport;
  if (rawTransport !== undefined && rawTransport !== null && rawTransport !== '') {
    const transport = String(rawTransport).trim().toUpperCase();
    if (!VALID_ARRIVAL_TRANSPORTS.includes(transport)) {
      errors.push({
        field: transportKey,
        message: `Arrival transport must be one of: ${VALID_ARRIVAL_TRANSPORTS.join(', ')}`
      });
    }
  }

  // Arrival Time: nullable/optional, ISO datetime string check
  const timeKey = b.arrival_time !== undefined ? 'arrival_time' : 'arrivalTime';
  const rawArrivalTime = b.arrival_time !== undefined ? b.arrival_time : b.arrivalTime;
  if (rawArrivalTime !== undefined && rawArrivalTime !== null && rawArrivalTime !== '') {
    const parsedTime = new Date(rawArrivalTime);
    if (isNaN(parsedTime.getTime())) {
      errors.push({
        field: timeKey,
        message: 'Arrival time must be a valid ISO datetime string'
      });
    }
  }

  return errors;
}

module.exports = {
  validateTriageInput,
  VALID_ARRIVAL_TRANSPORTS,
  UUID_REGEX
};

