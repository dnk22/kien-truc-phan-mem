const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();
async function seed() {
  await prisma.foundationMetadata.upsert({
    where: { key: 'milestone' },
    create: { key: 'milestone', value: 'DEV-3' },
    update: { value: 'DEV-3' },
  });
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.DEMO_SEED_ENABLED !== 'true'
  )
    return;
  for (const [code, name] of [
    ['NCC-01', 'Nhà cung cấp thực phẩm'],
    ['NCC-02', 'Nhà cung cấp đồ uống'],
    ['NCC-03', 'Nhà cung cấp gia dụng'],
  ]) {
    await prisma.supplier.upsert({
      where: { code },
      create: { code, name },
      update: {},
    });
  }
  console.log(
    'Inventory demo suppliers seeded; create and confirm receipts for stock.',
  );
}
seed()
  .catch(() => {
    console.error('Seed failed');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
