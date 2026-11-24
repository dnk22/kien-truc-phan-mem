const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();
const groups = [
  [
    'FOOD',
    'Thực phẩm',
    ['Mì Hảo Hảo', 'Gạo 1kg', 'Dầu ăn 1L', 'Nước mắm', 'Bún khô'],
  ],
  [
    'DRINK',
    'Đồ uống',
    [
      'Coca-Cola 330ml',
      'Nước suối Aquafina',
      'Trà xanh',
      'Cà phê lon',
      'Nước cam',
    ],
  ],
  [
    'MILK',
    'Sữa',
    ['Sữa tươi Vinamilk', 'Sữa chua', 'Sữa đặc', 'Sữa đậu nành', 'Sữa cacao'],
  ],
  [
    'SNACK',
    'Bánh kẹo',
    ['Bánh Oreo', 'Bánh quy', 'Kẹo gừng', 'Snack khoai tây', 'Bánh gạo'],
  ],
  [
    'CLEAN',
    'Hóa phẩm',
    ['Nước rửa chén', 'Bột giặt', 'Xà phòng', 'Nước lau sàn', 'Dầu gội'],
  ],
  [
    'HOME',
    'Đồ gia dụng',
    ['Giấy vệ sinh', 'Khăn giấy', 'Túi rác', 'Miếng rửa chén', 'Ly giấy'],
  ],
];
async function seed() {
  await prisma.foundationMetadata.upsert({
    where: { key: 'milestone' },
    create: { key: 'milestone', value: 'DEV-2' },
    update: { value: 'DEV-2' },
  });
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.DEMO_SEED_ENABLED !== 'true'
  )
    return;
  for (const [code, name, products] of groups) {
    const category = await prisma.category.upsert({
      where: { code },
      create: { code, name },
      update: {},
    });
    if (category.status !== 'ACTIVE') continue;
    for (const [i, product] of products.entries()) {
      const sku = code + '-' + String(i + 1).padStart(3, '0');
      await prisma.product.upsert({
        where: { code: sku },
        create: {
          code: sku,
          name: product,
          categoryId: category.id,
          unit: 'Cái',
          sellingPrice: 10000 + i * 5000,
          barcode: 'DEMO-' + sku,
          status: i === 4 ? 'INACTIVE' : 'ACTIVE',
        },
        update: {},
      });
    }
  }
  console.log('product: catalog demo seed completed');
}
seed()
  .catch(() => {
    console.error('Seed failed');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
