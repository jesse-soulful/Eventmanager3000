import { PrismaClient } from '@prisma/client';
import path from 'path';

// Use test database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/test.db';

// Ensure test database path is absolute
function getTestDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL!;
  if (dbUrl.startsWith('file:./') || dbUrl.startsWith('file:../')) {
    const relativePath = dbUrl.replace(/^file:/, '');
    const absolutePath = path.resolve(process.cwd(), relativePath);
    return `file:${absolutePath}`;
  }
  return dbUrl;
}

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: getTestDatabaseUrl(),
    },
  },
});

// Clean up database before all tests
beforeAll(async () => {
  // Delete all data from tables (in correct order to respect foreign keys)
  // Wrap each delete in try-catch to handle missing tables gracefully
  const deleteOperations = [
    () => testPrisma.comment.deleteMany(),
    () => testPrisma.lineItem.deleteMany(),
    () => testPrisma.subLineItemType.deleteMany(),
    () => testPrisma.tag.deleteMany(),
    () => testPrisma.category.deleteMany(),
    () => testPrisma.status.deleteMany(),
    () => testPrisma.event.deleteMany(),
    () => testPrisma.passwordResetToken.deleteMany(),
    () => testPrisma.session.deleteMany(),
    () => testPrisma.account.deleteMany(),
    () => testPrisma.user.deleteMany(),
  ];

  for (const operation of deleteOperations) {
    try {
      await operation();
    } catch (e: any) {
      // Ignore errors about missing tables
      if (!e.message?.includes('does not exist')) {
        throw e;
      }
    }
  }
});

// Clean up after all tests
afterAll(async () => {
  await testPrisma.$disconnect();
});

// Export test Prisma client
export { testPrisma };

