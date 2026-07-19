import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Prisma client singleton with logging.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

/**
 * Test database client (separate instance for isolation).
 */
export const createTestClient = (): PrismaClient => {
  return new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL.replace(/citemind/, 'citemind_test'),
      },
    },
  });
};

/**
 * Gracefully disconnect from the database.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
