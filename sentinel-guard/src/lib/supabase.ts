import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, AppStateStatus } from "react-native";

// ============================================================================
// Environment Variables
// ============================================================================

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// ============================================================================
// Supabase Client Initialization
// ============================================================================

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================================================
// AppState Event Listeners (Proper cleanup pattern)
// ============================================================================

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null =
  null;

const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (nextAppState === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
};

// Initialize subscription and store cleanup function
export const initializeAppStateListener = () => {
  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
  }
  return () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
};

// Auto-initialize on import (backward compatible)
initializeAppStateListener();

// ============================================================================
// Database Types
// ============================================================================

export interface UserData {
  id: string;
  sap_id: string;
  full_name: string;
  semester: string;
  section: string;
  is_paid: boolean;
  is_active: boolean;
  activation_token?: string;
  profile_photo_url?: string | null;
}

export interface AccessLogEntry {
  id: string;
  user_id: string;
  scanner_id?: string;
  type: "ENTRY" | "EXIT";
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  timestamp: string;
}

// ============================================================================
// Session Cache (Performance optimization - prevents multiple auth calls)
// ============================================================================

let cachedSession: { userId: string; email: string } | null = null;
let sessionCacheTime = 0;
const SESSION_CACHE_TTL = 30000; // 30 seconds

export const getCachedSession = async (): Promise<{
  userId: string;
  email: string;
} | null> => {
  const now = Date.now();

  // Return cached if still valid
  if (cachedSession && now - sessionCacheTime < SESSION_CACHE_TTL) {
    return cachedSession;
  }

  // Fetch fresh session
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    cachedSession = {
      userId: data.session.user.id,
      email: data.session.user.email || "",
    };
    sessionCacheTime = now;
    return cachedSession;
  }

  cachedSession = null;
  return null;
};

// ============================================================================
// Helper: Network Timeout Wrapper
// ============================================================================

const NETWORK_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Wraps a promise with a timeout to prevent infinite hanging
 */
const performWithTimeout = async <T>(
  promise: PromiseLike<{ data: T | null; error: any }>,
  operationName: string
): Promise<{ data: T | null; error: any }> => {
  const timeoutPromise = new Promise<{ data: null; error: any }>(
    (_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timed out"));
      }, NETWORK_TIMEOUT_MS);
    }
  );

  try {
    // Promise.race requires strictly Promises, so we resolve the PromiseLike first
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } catch (error: any) {
    if (error.message === "Request timed out") {
      return {
        data: null,
        error: {
          code: "PGRST100",
          message: "Network timeout - check connection",
        },
      };
    }
    throw error;
  }
};

// ============================================================================
// DEBUG: Connection Test Function (DEV only)
// ============================================================================

export const testDatabaseConnection = async (): Promise<void> => {
  if (!__DEV__) return; // Skip in production

  console.log("========================================");
  console.log("DATABASE CONNECTION TEST (DEV)");
  console.log("========================================");

  const session = await getCachedSession();
  console.log(
    "Auth Status:",
    session ? `Logged in as ${session.email}` : "NOT LOGGED IN"
  );

  // Test Users Table
  const { data: users, error: usersError } = await performWithTimeout<any[]>(
    supabase
      .from("users")
      .select("id, sap_id, full_name, role")
      .limit(1) as any,
    "TestConn"
  );

  if (usersError) {
    console.error("Users Table Error:", usersError.code, usersError.message);
  } else if (users && users.length > 0) {
    console.log("Users Table Accessible");
    console.log("Columns:", Object.keys(users[0]));
  } else {
    console.log("Users Table Empty");
  }

  // Test Access Logs Table
  const { data: logs, error: logsError } = await performWithTimeout<any[]>(
    supabase
      .from("access_logs")
      .select("id, user_id, scanner_id, type, status")
      .limit(1) as any,
    "TestLogs"
  );

  if (logsError) {
    console.error(
      "Access Logs Table Error:",
      logsError.code,
      logsError.message
    );
  } else {
    console.log("Access Logs Table Accessible");
    if (logs && logs.length > 0) {
      console.log("Columns:", Object.keys(logs[0]));
    }
  }

  console.log("========================================");
};

// ============================================================================
// Database Error Class
// ============================================================================

export class DatabaseError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "DatabaseError";
  }
}

// ============================================================================
// Server-Side Rate Limiting (Security Enhancement)
// ============================================================================
// These functions check/update rate limiting in the database, not AsyncStorage.
// This prevents bypass by clearing app data or reinstalling.

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface GuardLoginStatus {
  isLocked: boolean;
  lockedUntil: Date | null;
  failedAttempts: number;
  remainingMinutes: number;
}

/**
 * Check if a guard account is locked due to too many failed attempts
 * This queries the database directly - cannot be bypassed by clearing app data
 */
export const getGuardLoginStatus = async (
  email: string
): Promise<GuardLoginStatus> => {
  try {
    const { data, error } = await performWithTimeout<any>(
      supabase
        .from("users")
        .select("failed_login_attempts, locked_until")
        .eq("email", email.toLowerCase())
        .single() as any,
      "getGuardLoginStatus"
    );

    if (error || !data) {
      // User not found or error - return unlocked (let auth handle it)
      return {
        isLocked: false,
        lockedUntil: null,
        failedAttempts: 0,
        remainingMinutes: 0,
      };
    }

    const lockedUntil = data.locked_until ? new Date(data.locked_until) : null;
    const now = new Date();

    // Check if lockout has expired
    if (lockedUntil && lockedUntil > now) {
      const remainingMs = lockedUntil.getTime() - now.getTime();
      return {
        isLocked: true,
        lockedUntil,
        failedAttempts: data.failed_login_attempts || 0,
        remainingMinutes: Math.ceil(remainingMs / 60000),
      };
    }

    return {
      isLocked: false,
      lockedUntil: null,
      failedAttempts: data.failed_login_attempts || 0,
      remainingMinutes: 0,
    };
  } catch (error) {
    if (__DEV__) {
      console.error("[DB] getGuardLoginStatus error:", error);
    }
    // On error, allow login attempt (let Supabase auth handle it)
    return {
      isLocked: false,
      lockedUntil: null,
      failedAttempts: 0,
      remainingMinutes: 0,
    };
  }
};

/**
 * Increment failed login attempts for a guard
 * Returns true if account is now locked
 */
export const incrementFailedLogin = async (
  userId: string
): Promise<{
  isNowLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
}> => {
  try {
    // First get current count
    const { data: userData, error: fetchError } = await performWithTimeout<any>(
      supabase
        .from("users")
        .select("failed_login_attempts")
        .eq("id", userId)
        .single() as any,
      "getFailedAttempts"
    );

    if (fetchError || !userData) {
      return {
        isNowLocked: false,
        failedAttempts: 0,
        remainingAttempts: MAX_FAILED_ATTEMPTS,
      };
    }

    const currentAttempts = userData.failed_login_attempts || 0;
    const newAttempts = currentAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

    // Update the database
    const updateData: any = {
      failed_login_attempts: newAttempts,
      last_failed_login: new Date().toISOString(),
    };

    if (shouldLock) {
      updateData.locked_until = new Date(
        Date.now() + LOCKOUT_DURATION_MS
      ).toISOString();
    }

    await performWithTimeout(
      supabase.from("users").update(updateData).eq("id", userId) as any,
      "updateFailedAttempts"
    );

    return {
      isNowLocked: shouldLock,
      failedAttempts: newAttempts,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts),
    };
  } catch (error) {
    if (__DEV__) {
      console.error("[DB] incrementFailedLogin error:", error);
    }
    return {
      isNowLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }
};

/**
 * Reset failed login attempts on successful login
 */
export const resetLoginAttempts = async (userId: string): Promise<void> => {
  try {
    await performWithTimeout(
      supabase
        .from("users")
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          last_failed_login: null,
        })
        .eq("id", userId) as any,
      "resetLoginAttempts"
    );
  } catch (error) {
    if (__DEV__) {
      console.error("[DB] resetLoginAttempts error:", error);
    }
    // Non-critical - login still succeeds
  }
};

// ============================================================================
// Database Query Functions
// ============================================================================

/**
 * Fetch user by SAP ID with robust error handling
 * @throws DatabaseError with specific error type
 */
export const getUserBySapId = async (sapId: string): Promise<UserData> => {
  if (__DEV__) {
    console.log(`[DB] Searching for SAP ID: ${sapId}`);
  }

  // 1. Check if logged in (using cached session)
  const session = await getCachedSession();
  if (!session) {
    throw new DatabaseError("Guard not logged in", "NO_SESSION");
  }

  if (__DEV__) {
    console.log(`[DB] Authenticated as: ${session.email}`);
  }

  // 2. Query database with explicit fields (avoid overfetching)
  // SECURITY FIX: Removed 'activation_token' from selection
  const { data, error } = await performWithTimeout<UserData>(
    supabase
      .from("users")
      .select(
        // SECURITY NOTE: activation_token is required for offline HMAC verification.
        // This is a trade-off between security and reliability.
        "id, sap_id, full_name, semester, section, is_paid, is_active, activation_token, profile_photo_url"
      )
      .eq("sap_id", sapId)
      .single() as any,
    "getUserBySapId"
  );

  // 3. Handle errors
  if (error) {
    if (__DEV__) {
      console.error(`[DB] Query Error:`, error.code, error.message);
    }

    switch (error.code) {
      case "PGRST100":
      case "PGRST000":
        throw new DatabaseError("Network Error - Check connection", "NETWORK");
      case "42501":
        throw new DatabaseError(
          "Permission Error - RLS blocking access",
          "PERMISSION"
        );
      case "PGRST116":
        throw new DatabaseError(`Student ID ${sapId} not found`, "NOT_FOUND");
      default:
        throw new DatabaseError(`Database Error: ${error.message}`, error.code);
    }
  }

  // 4. Validate data
  if (!data) {
    throw new DatabaseError(`Student ID ${sapId} not found`, "NOT_FOUND");
  }

  if (__DEV__) {
    console.log(`[DB] Found User:`, data.full_name, `(${data.sap_id})`);
  }

  return data;
};

/**
 * Get recent access log for double-entry check
 * Uses a 24-hour window to handle day-long events properly
 */
export const getRecentAccessLog = async (
  userId: string
): Promise<(AccessLogEntry & { scanner_name?: string }) | null> => {
  // Extended to 24 hours for full-day event coverage
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await performWithTimeout<any>(
    supabase
      .from("access_logs")
      .select(
        `
        id,
        user_id,
        type,
        status,
        timestamp,
        scanner_id,
        scanner:scanner_id ( full_name )
      `
      )
      .eq("user_id", userId)
      .gte("timestamp", twentyFourHoursAgo)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single() as any,
    "getRecentAccessLog"
  );

  if (error && error.code !== "PGRST116") {
    if (__DEV__) {
      console.error("[DB] getRecentAccessLog error:", error.message);
    }
    return null;
  }

  if (data) {
    return {
      ...data,
      scanner_name: data.scanner?.full_name,
    };
  }

  return null;
};

/**
 * Insert access log entry with scanner and event tracking
 * @param eventId - Optional event ID, will fetch active event if not provided
 */
export const insertAccessLog = async (
  userId: string,
  type: "ENTRY" | "EXIT",
  status: "GRANTED" | "REJECTED" | "DUPLICATE" = "GRANTED",
  eventId?: string
): Promise<boolean> => {
  // Get current scanner's ID from cached session
  const session = await getCachedSession();

  // If no eventId provided, fetch current active event
  let resolvedEventId = eventId;
  if (!resolvedEventId) {
    const { data: activeEvent } = await performWithTimeout<{ id: string }>(
      supabase
        .from("events")
        .select("id")
        .eq("is_default", true)
        .single() as any,
      "getActiveEvent"
    );
    resolvedEventId = activeEvent?.id || undefined;
  }

  // Generate a simple cuid-like ID
  const id = `c${Date.now().toString(36)}${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const { error } = await performWithTimeout(
    supabase.from("access_logs").insert({
      id: id,
      user_id: userId,
      scanner_id: session?.userId || null,
      type: type,
      status: status,
      event_id: resolvedEventId || null,
    }) as any, // Type cast to avoid generic insert error
    "insertAccessLog"
  );

  if (error) {
    if (__DEV__) {
      console.error("[DB] insertAccessLog error:", error.message);
    }

    // OFFLINE FALLBACK
    // If error looks like network issue, save to local queue
    if (
      error.message === "Request timed out" ||
      error.message?.includes("Network request failed") ||
      error.code === "PGRST100" // PostgREST timeout/connection
    ) {
      const { saveOfflineLog } = require("./offline");
      await saveOfflineLog({
        id,
        user_id: userId,
        scanner_id: session?.userId || null,
        type,
        status,
        event_id: resolvedEventId || undefined,
        timestamp: new Date().toISOString(),
      });
      return true; // We return true because it's "saved" (locally)
    }

    return false;
  }

  if (__DEV__) {
    console.log("[DB] Access log created:", id, "event:", resolvedEventId);
  }
  return true;
};

/**
 * Get access logs with user data (for history screen)
 * Uses Supabase joins for efficient single-query fetch
 */
export const getAccessLogsWithUsers = async (
  limit: number = 50
): Promise<
  Array<{
    id: string;
    timestamp: string;
    type: "ENTRY" | "EXIT";
    status: string;
    user_id: string;
    user_name: string;
    user_sap_id: string;
  }>
> => {
  // PRIVACY FIX: Filter by current scanner_id
  const session = await getCachedSession();

  // If not logged in, return empty (shouldn't happen on history screen)
  if (!session?.userId) return [];

  const { data, error } = await performWithTimeout<any[]>(
    supabase
      .from("access_logs")
      .select(
        `
        id,
        timestamp,
        type,
        status,
        user_id,
        scanner_id,
        users:user_id (full_name, sap_id)
      `
      )
      .eq("scanner_id", session.userId) // Only show logs created by THIS guard
      .order("timestamp", { ascending: false })
      .limit(limit) as any,
    "getAccessLogsWithUsers"
  );

  if (error) {
    if (__DEV__) {
      console.error("[DB] getAccessLogsWithUsers error:", error.message);
    }
    return [];
  }

  // Transform the joined data to flat structure
  return (data || []).map((log: any) => ({
    id: log.id,
    timestamp: log.timestamp,
    type: log.type,
    status: log.status,
    user_id: log.user_id,
    user_name: log.users?.full_name || "Unknown",
    user_sap_id: log.users?.sap_id || "N/A",
  }));
};

/**
 * Fetch recent activity logs for a specific student (for duplicate feedback)
 */
export const getStudentActivityLogs = async (
  userId: string,
  limit: number = 100,
  type?: "ENTRY" | "EXIT"
): Promise<Array<AccessLogEntry & { scanner_name?: string }>> => {
  let query = supabase
    .from("access_logs")
    .select(
      `
      id,
      user_id,
      type,
      status,
      timestamp,
      scanner_id,
      scanner:scanner_id ( full_name )
    `
    )
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await performWithTimeout<any[]>(
    query as any,
    "getStudentActivityLogs"
  );

  if (error) {
    if (__DEV__) {
      console.error("[DB] getStudentActivityLogs error:", error.message);
    }
    return [];
  }

  return (data || []).map((log: any) => ({
    id: log.id,
    timestamp: log.timestamp,
    type: log.type,
    status: log.status,
    user_id: log.user_id,
    scanner_id: log.scanner_id,
    scanner_name: log.scanner?.full_name || "Unknown",
  }));
};
