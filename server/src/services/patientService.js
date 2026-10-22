const prisma = require('../config/db');
const { NotFoundError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

async function createPatient(data) {
  const patient = await prisma.patient.create({
    data: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      date_of_birth: new Date(data.date_of_birth),
      gender: data.gender.trim(),
      phone_number: data.phone_number ? data.phone_number.trim() : null
    }
  });

  logger.info('Patient registered successfully', { meta: { patient_id: patient.patient_id } });
  return patient;
}

async function getPatients({ page = 1, limit = 20, search = '' } = {}) {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { first_name: { contains: term, mode: 'insensitive' } },
      { last_name: { contains: term, mode: 'insensitive' } },
      { phone_number: { contains: term, mode: 'insensitive' } }
    ];
  }

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      skip,
      take,
      orderBy: { registered_at: 'desc' }
    })
  ]);

  return {
    patients,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take)
    }
  };
}

async function getPatientById(patient_id) {
  const patient = await prisma.patient.findUnique({
    where: { patient_id },
    include: {
      assessments: {
        orderBy: { assessed_at: 'desc' },
        include: {
          prediction: true,
          nurse: {
            select: { user_id: true, full_name: true, username: true }
          }
        }
      },
      queueEntries: {
        orderBy: { queued_at: 'desc' }
      }
    }
  });

  if (!patient) {
    throw new NotFoundError(`Patient with ID '${patient_id}' not found`);
  }

  return patient;
}

async function updatePatient(patient_id, data) {
  // Verify patient exists
  await getPatientById(patient_id);

  const updateData = {};
  if (data.first_name !== undefined) updateData.first_name = data.first_name.trim();
  if (data.last_name !== undefined) updateData.last_name = data.last_name.trim();
  if (data.date_of_birth !== undefined) updateData.date_of_birth = new Date(data.date_of_birth);
  if (data.gender !== undefined) updateData.gender = data.gender.trim();
  if (data.phone_number !== undefined) updateData.phone_number = data.phone_number ? data.phone_number.trim() : null;

  const updated = await prisma.patient.update({
    where: { patient_id },
    data: updateData
  });

  logger.info('Patient details updated', { meta: { patient_id } });
  return updated;
}

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient
};

