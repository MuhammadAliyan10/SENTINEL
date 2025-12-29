// ============================================
// SENTINEL - Rate Limiting Utility
// ============================================
// In-memory rate limiter for API protection
// For production at scale, replace with Redis-based solution

import { TIME } from "@/lib/constants";
import { logger } from "@/lib/logger";

// ============================================
// TYPES
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
}

// ============================================
// IN-MEMORY STORE
// ============================================
// Note: This resets on serverless cold starts
// For persistent rate limiting, use Redis/Upstash

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leak
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ============================================
// RATE LIMIT CHECK
// ============================================

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const key = `${identifier}`;

  let entry = rateLimitStore.get(key);

  // Create new entry or reset expired one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > config.maxRequests) {
    logger.warn("Rate limit exceeded", {
      identifier,
      count: entry.count,
      limit: config.maxRequests,
    });
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const RATE_LIMITS = {
  // Login attempts: 5 per 15 minutes
  LOGIN: {
    maxRequests: TIME.MAX_FAILED_ATTEMPTS,
    windowMs: TIME.RATE_LIMIT_WINDOW_MS,
  },

  // API calls: 100 per minute
  API_GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },

  // QR verification: 30 per minute (guards scanning)
  QR_VERIFY: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },

  // Password reset: 3 per hour
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },

  // Export/download: 5 per 10 minutes
  EXPORT: {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  },
} as const;

// ============================================
// HELPER: Get identifier from request
// ============================================

export function getClientIdentifier(
  ip: string | null,
  userId?: string
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }
  // Fall back to IP for unauthenticated
  return `ip:${ip || "unknown"}`;
}

// ============================================
// MIDDLEWARE HELPER
// ============================================
// Returns headers to add to response

export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetIn),
  };
}
