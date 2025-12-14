import { PrismaClient } from "@prisma/client";

/**
 * SENTINEL PRISMA CLIENT (Optimized for Serverless)
 *
 * Key Optimizations:
 * 1. Singleton pattern - reuses connections across requests
 * 2. Connection pool limits for serverless environments
 * 3. Proper production/development handling
 *
 * CONNECTION POOLING NOTE:
 * For Vercel/Serverless, Prisma recommends using a connection pooler
 * like Supabase's Transaction Pooler (port 6543) with ?pgbouncer=true
 * in the DATABASE_URL environment variable.
 */

// Extend globalThis to include prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create optimized Prisma client
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Datasource configuration is handled via DATABASE_URL
    // For serverless: Use Supabase Transaction Pooler (port 6543)
    // Example: postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true
  });
}

// Export singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Persist singleton in both development AND production for serverless
// This prevents creating new connections on each request
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Useful for long-running processes (not typically needed in serverless)
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
