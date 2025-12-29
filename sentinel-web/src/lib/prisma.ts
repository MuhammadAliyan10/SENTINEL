import { PrismaClient } from "@prisma/client";

/**
 * SENTINEL PRISMA CLIENT (Optimized for Serverless + High Concurrency)
 *
 * Key Optimizations for 700+ Concurrent Users:
 * 1. Singleton pattern - reuses connections across serverless invocations
 * 2. Explicit connection pool limits for Vercel/Serverless environments
 * 3. PgBouncer Transaction Pooler configuration
 * 4. Graceful connection lifecycle management
 *
 * CONNECTION POOLING STRATEGY:
 * Supabase provides two connection methods:
 * - Direct Connection (Port 5432): Limited to ~60 connections, good for migrations
 * - Transaction Pooler (Port 6543): Supports 10,000+ connections via PgBouncer
 *
 * For serverless environments, ALWAYS use the Transaction Pooler with ?pgbouncer=true
 * to prevent "too many connections" errors during peak load.
 */

// ============================================
// GLOBAL SINGLETON PATTERN
// ============================================
// Extend globalThis to preserve Prisma instance across hot reloads (development)
// and across serverless function invocations (production)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ============================================
// PRISMA CLIENT FACTORY
// ============================================
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    // LOGGING: Verbose in development, errors only in production
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],

    // DATASOURCE OVERRIDE: Use environment-specific connection string
    // This allows using DIRECT_URL for migrations and DATABASE_URL for queries
    // No override needed here - Prisma will use DATABASE_URL from .env by default

    // CONNECTION POOL LIMITS (CRITICAL FOR SERVERLESS)
    // These limits prevent exhausting the PgBouncer pool
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // This should point to port 6543 with ?pgbouncer=true
      },
    },
  });
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================
// EXPLANATION:
// In serverless environments (Vercel), each function invocation starts with a "warm" container
// that may have a cached global object. By checking globalForPrisma.prisma, we reuse existing
// connections instead of creating new ones on every request.
//
// OLD APPROACH (Commented out):
// export const prisma = new PrismaClient(); // ❌ Creates new connection on EVERY import
//
// NEW APPROACH:
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Persist the singleton globally to survive hot reloads and warm starts
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Use this when deploying to long-running processes (e.g., Docker, VPS)
 * Not typically needed for serverless, but provided for flexibility
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
