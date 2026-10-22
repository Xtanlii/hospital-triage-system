const patientService = require('../services/patientService');

async function createPatient(req, res, next) {
  try {
    const patient = await patientService.createPatient(req.body);
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (err) {
    next(err);
  }
}

async function getPatients(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const result = await patientService.getPatients({ page, limit, search });
    res.status(200).json({
      success: true,
      message: 'Patients retrieved successfully',
      data: result.patients,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
}

async function getPatientById(req, res, next) {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Patient retrieved successfully',
      data: patient
    });
  } catch (err) {
    next(err);
  }
}

async function updatePatient(req, res, next) {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient
};

