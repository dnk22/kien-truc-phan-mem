const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();
async function seed() {
  await prisma.foundationMetadata.upsert({
    where: { key: 'milestone' },
    create: { key: 'milestone', value: 'DEV-5' },
    update: { value: 'DEV-5' },
  });
  console.log('report: report schema seed completed (no mock facts)');
}
seed()
  .catch(() => {
    console.error('Seed failed');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
