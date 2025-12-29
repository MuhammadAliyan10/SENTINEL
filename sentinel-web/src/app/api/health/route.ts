import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger, generateRequestId } from "@/lib/logger";

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
// Returns system status for monitoring and deployment health checks
// Used by: Vercel, AWS ELB, Kubernetes, Uptime Robot, etc.

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: "up" | "down"; latency?: number };
    auth: { status: "up" | "down" };
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET() {
  const requestId = generateRequestId();
  const reqLogger = logger.child({ requestId, action: "health_check" });

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: { status: "down" },
      auth: { status: "down" },
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Check Database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: "up",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    health.checks.database = { status: "down" };
    health.status = "degraded";
    reqLogger.error("Database check failed", {
      error: error instanceof Error ? error.message : "Unknown",
    });
  }

  // Check Supabase Auth
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    health.checks.auth = { status: error ? "down" : "up" };
    if (error) {
      health.status = "degraded";
    }
  } catch (error) {
    health.checks.auth = { status: "down" };
    health.status = "degraded";
    reqLogger.error("Auth check failed", {
      error: error instanceof Error ? error.message : "Unknown",
    });
  }

  // If any critical check is down, mark as unhealthy
  if (
    health.checks.database.status === "down" &&
    health.checks.auth.status === "down"
  ) {
    health.status = "unhealthy";
  }

  const statusCode = health.status === "unhealthy" ? 503 : 200;

  reqLogger.info("Health check completed", {
    status: health.status,
    dbLatency: health.checks.database.latency,
  });

  return NextResponse.json(health, { status: statusCode });
}
