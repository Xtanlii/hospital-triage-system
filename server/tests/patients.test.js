const { validatePatient } = require('../src/validators/patientValidators');

describe('Patient Validation Unit Tests', () => {
  const validPatient = {
    first_name: 'Jane',
    last_name: 'Doe',
    date_of_birth: '1995-06-15',
    gender: 'Female',
    phone_number: '+1-555-9876'
  };

  test('Validates complete patient payload successfully', () => {
    const errors = validatePatient(validPatient);
    expect(errors).toHaveLength(0);
  });

  test('Rejects missing first name', () => {
    const invalid = { ...validPatient, first_name: '' };
    const errors = validatePatient(invalid);
    expect(errors.some((e) => e.field === 'first_name')).toBe(true);
  });

  test('Rejects missing last name', () => {
    const invalid = { ...validPatient, last_name: '   ' };
    const errors = validatePatient(invalid);
    expect(errors.some((e) => e.field === 'last_name')).toBe(true);
  });

  test('Rejects invalid date of birth format', () => {
    const invalid = { ...validPatient, date_of_birth: 'not-a-date' };
    const errors = validatePatient(invalid);
    expect(errors.some((e) => e.field === 'date_of_birth')).toBe(true);
  });

  test('Rejects future date of birth', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const invalid = { ...validPatient, date_of_birth: futureDate };
    const errors = validatePatient(invalid);
    expect(errors.some((e) => e.field === 'date_of_birth')).toBe(true);
  });

  test('Rejects invalid gender string', () => {
    const invalid = { ...validPatient, gender: 'InvalidGenderOption' };
    const errors = validatePatient(invalid);
    expect(errors.some((e) => e.field === 'gender')).toBe(true);
  });

  test('Permits partial updates when isUpdate flag is true', () => {
    const partialUpdate = { phone_number: '+1-555-0000' };
    const errors = validatePatient(partialUpdate, true);
    expect(errors).toHaveLength(0);
  });
});

