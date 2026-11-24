const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();
async function seed() {
  await prisma.foundationMetadata.upsert({
    where: { key: 'milestone' },
    create: { key: 'milestone', value: 'DEV-0' },
    update: { value: 'DEV-0' },
  });
  console.log('product: foundation seed completed (no business data)');
}
seed()
  .catch(() => {
    console.error('Seed failed');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
