import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRoles() {
  const defaultRoles: Array<{ id: number; name: string }> = [
    { id: 1, name: 'student' },
    { id: 2, name: 'instructor' },
    { id: 3, name: 'admin' },
    { id: 4, name: 'registrar' },
  ];

  for (const role of defaultRoles) {
    await prisma.roles.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
}

async function seedAdminUser() {
  const adminEmail = 'admin@iroha.local';
  const adminRole = await prisma.roles.findUnique({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    throw new Error('Admin role must exist before creating the admin user.');
  }

  const adminUser = await prisma.users.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      first_name: 'System',
      last_name: 'Admin',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$YXJnb24yc2VjcmV0$2VhbmRyb21zZWVkYWRtaW4=',
      locale: 'en',
      timezone: 'Asia/Riyadh',
    },
  });

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  });
}

async function seedSeason() {
  await prisma.seasons.upsert({
    where: { code: '2025-SUM' },
    update: {},
    create: {
      code: '2025-SUM',
      title: 'Summer 2025 Intensive',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-08-31'),
      enrollment_open: new Date('2025-04-01T08:00:00Z'),
      enrollment_close: new Date('2025-05-20T23:59:00Z'),
      status: 'scheduled',
    },
  });
}

async function main() {
  await seedRoles();
  await seedAdminUser();
  await seedSeason();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed script failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
