function validatePatient(body, isUpdate = false) {
  const errors = [];
  const { first_name, last_name, date_of_birth, gender, phone_number } = body || {};

  if (!isUpdate || first_name !== undefined) {
    if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
      errors.push({ field: 'first_name', message: 'First name is required' });
    } else if (first_name.trim().length > 100) {
      errors.push({ field: 'first_name', message: 'First name cannot exceed 100 characters' });
    }
  }

  if (!isUpdate || last_name !== undefined) {
    if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
      errors.push({ field: 'last_name', message: 'Last name is required' });
    } else if (last_name.trim().length > 100) {
      errors.push({ field: 'last_name', message: 'Last name cannot exceed 100 characters' });
    }
  }

  if (!isUpdate || date_of_birth !== undefined) {
    if (!date_of_birth) {
      errors.push({ field: 'date_of_birth', message: 'Date of birth is required' });
    } else {
      const dob = new Date(date_of_birth);
      if (isNaN(dob.getTime())) {
        errors.push({ field: 'date_of_birth', message: 'Date of birth must be a valid date' });
      } else if (dob > new Date()) {
        errors.push({ field: 'date_of_birth', message: 'Date of birth cannot be in the future' });
      }
    }
  }

  if (!isUpdate || gender !== undefined) {
    const validGenders = ['Male', 'Female', 'Other', 'Non-Binary', 'male', 'female', 'other', 'non-binary'];
    if (!gender || typeof gender !== 'string' || !validGenders.includes(gender.trim())) {
      errors.push({ field: 'gender', message: 'Gender is required (Male, Female, Other, Non-Binary)' });
    }
  }

  if (phone_number !== undefined && phone_number !== null && phone_number !== '') {
    if (typeof phone_number !== 'string' || phone_number.trim().length > 30) {
      errors.push({ field: 'phone_number', message: 'Phone number cannot exceed 30 characters' });
    }
  }

  return errors;
}

module.exports = {
  validatePatient
};

