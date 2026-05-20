import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Очистка старых данных...');
  await prisma.balanceHistory.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Создание тестового пользователя...');
  const user = await prisma.user.create({
    data: {
      id: 1,
      balance: 1000.00,
    },
  });

  console.log('Создание стартовой истории пополнения...');
  await prisma.balanceHistory.create({
    data: {
      userId: user.id,
      action: 'credit',
      amount: 1000.00,
    },
  });

  console.log('Seed completed успешно!');
}

main()
  .catch((e) => {
    console.error('Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
