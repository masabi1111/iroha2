import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<number> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection healthy.');
    return 0;
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? 'UNKNOWN';
    const message = (error as { message?: string }).message ?? String(error);
    console.error(`Database health check failed [${code}]: ${message}`);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    console.error('Unexpected error during database health check:', error);
    process.exit(1);
  });
