// ============================================
// SENTINEL - Structured Logger
// ============================================
// Production-grade logging with request IDs and structured format
// Replace console.log with logger.info, logger.error, etc.

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  environment: string;
}

// Generate unique request ID (use crypto if available, fallback to timestamp)
export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// Get current environment
const getEnvironment = (): string => {
  if (typeof process !== "undefined") {
    return process.env.NODE_ENV || "development";
  }
  return "browser";
};

// Format log entry as JSON for production, readable for development
const formatLog = (entry: LogEntry): string => {
  const env = getEnvironment();

  if (env === "production") {
    // JSON format for log aggregators (Datadog, CloudWatch, etc.)
    return JSON.stringify(entry);
  }

  // Readable format for development
  const { timestamp, level, message, context } = entry;
  const contextStr = Object.keys(context).length
    ? ` ${JSON.stringify(context)}`
    : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
};

// Core logging function
const log = (level: LogLevel, message: string, context: LogContext = {}) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    environment: getEnvironment(),
  };

  const formatted = formatLog(entry);

  switch (level) {
    case "debug":
      if (getEnvironment() !== "production") {
        console.debug(formatted);
      }
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }

  // In production, you could send to external service here
  // Example: sendToDatadog(entry);
};

// ============================================
// EXPORTED LOGGER INTERFACE
// ============================================

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),

  // Convenience method for timing operations
  timed: async <T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> => {
    const start = Date.now();
    try {
      const result = await fn();
      log("info", `${operation} completed`, {
        ...context,
        duration: Date.now() - start,
      });
      return result;
    } catch (error) {
      log("error", `${operation} failed`, {
        ...context,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  // Create a child logger with preset context (e.g., requestId)
  child: (baseContext: LogContext) => ({
    debug: (message: string, context?: LogContext) =>
      log("debug", message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log("info", message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      log("warn", message, { ...baseContext, ...context }),
    error: (message: string, context?: LogContext) =>
      log("error", message, { ...baseContext, ...context }),
  }),
};

// ============================================
// EXAMPLE USAGE
// ============================================
// import { logger, generateRequestId } from '@/lib/logger';
//
// // Basic logging
// logger.info('User logged in', { userId: '123' });
// logger.error('Database connection failed', { error: 'Timeout' });
//
// // With request ID (in API routes)
// const requestId = generateRequestId();
// const reqLogger = logger.child({ requestId });
// reqLogger.info('Processing request');
// reqLogger.info('Request completed');
//
// // Timing operations
// const result = await logger.timed('fetchUsers', async () => {
//   return await prisma.user.findMany();
// }, { count: 100 });
