import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL is set - use absolute path for SQLite
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    // Convert relative paths to absolute
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.startsWith('file:./') || dbUrl.startsWith('file:../')) {
      const relativePath = dbUrl.replace(/^file:/, '');
      const absolutePath = path.resolve(process.cwd(), relativePath);
      return `file:${absolutePath}`;
    }
    return dbUrl;
  }
  
  // Fallback: construct absolute path to database
  const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
  return `file:${dbPath}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


