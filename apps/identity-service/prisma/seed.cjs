const { PrismaClient } = require('../src/generated/client');
const { hash } = require('bcrypt');
const prisma = new PrismaClient();
async function seed() {
  await prisma.foundationMetadata.upsert({
    where: { key: 'milestone' },
    create: { key: 'milestone', value: 'DEV-0' },
    update: {},
  });
  if (process.env.DEMO_SEED_ENABLED !== 'true') {
    console.log('identity: demo seed disabled');
    return;
  }
  if (!['development', 'test'].includes(process.env.NODE_ENV ?? 'development'))
    throw new Error('Demo seed requires development/test NODE_ENV');
  const password = process.env.DEMO_PASSWORD;
  if (!password || !/^[\x20-\x7E]{10,64}$/.test(password))
    throw new Error('Set DEMO_PASSWORD (10-64 printable ASCII characters)');
  const names = {
    admin: ['ADMIN', 'Quản trị viên'],
    manager: ['MANAGER', 'Quản lý siêu thị'],
    cashier: ['CASHIER', 'Nhân viên bán hàng'],
    warehouse: ['WAREHOUSE', 'Nhân viên kho'],
  };
  const passwordHash = await hash(password, 12);
  for (const [username, [role, fullName]] of Object.entries(names)) {
    await prisma.user.upsert({
      where: { username },
      create: { username, role, fullName, passwordHash },
      update: {},
    });
  }
  console.log('identity: demo seed completed; existing accounts unchanged');
}
seed()
  .catch(() => {
    console.error('Seed failed: verify demo environment and database');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
