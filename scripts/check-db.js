const prisma = require('../server/src/config/db');

async function check() {
  const entries = await prisma.queueEntry.findMany({
    include: {
      patient: true,
      prediction: true
    }
  });
  console.log('Total queue entries in DB:', entries.length);
  entries.forEach(e => {
    console.log(`- ${e.queue_number}: status="${e.status}", patient="${e.patient?.first_name} ${e.patient?.last_name}", dept="${e.department}"`);
  });
  await prisma.$disconnect();
}

check().catch(console.error);
