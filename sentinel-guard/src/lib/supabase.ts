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

// Note: Session cache is automatically invalidated when getCachedSession
// fetches a new session after TTL expires. No separate listener needed.

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
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, sap_id, full_name, role")
    .limit(1);

  if (usersError) {
    console.error("Users Table Error:", usersError.code, usersError.message);
  } else if (users && users.length > 0) {
    console.log("Users Table Accessible");
    console.log("Columns:", Object.keys(users[0]));
  } else {
    console.log("Users Table Empty");
  }

  // Test Access Logs Table
  const { data: logs, error: logsError } = await supabase
    .from("access_logs")
    .select("id, user_id, scanner_id, type, status")
    .limit(1);

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
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, sap_id, full_name, semester, section, is_paid, is_active, activation_token, profile_photo_url"
    )
    .eq("sap_id", sapId)
    .single();

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

  return data as UserData;
};

/**
 * Get recent access log for double-entry check
 * Uses a 24-hour window to handle day-long events properly
 */
export const getRecentAccessLog = async (
  userId: string
): Promise<AccessLogEntry | null> => {
  // Extended to 24 hours for full-day event coverage
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("access_logs")
    .select("id, user_id, type, status, timestamp")
    .eq("user_id", userId)
    .gte("timestamp", twentyFourHoursAgo)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    if (__DEV__) {
      console.error("[DB] getRecentAccessLog error:", error.message);
    }
    return null;
  }

  return data;
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
    const { data: activeEvent } = await supabase
      .from("events")
      .select("id")
      .eq("is_default", true)
      .single();
    resolvedEventId = activeEvent?.id || undefined;
  }

  // Generate a simple cuid-like ID
  const id = `c${Date.now().toString(36)}${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const { error } = await supabase.from("access_logs").insert({
    id: id,
    user_id: userId,
    scanner_id: session?.userId || null,
    type: type,
    status: status,
    event_id: resolvedEventId || null,
  });

  if (error) {
    if (__DEV__) {
      console.error("[DB] insertAccessLog error:", error.message);
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
  const { data, error } = await supabase
    .from("access_logs")
    .select(
      `
      id,
      timestamp,
      type,
      status,
      user_id,
      users:user_id (full_name, sap_id)
    `
    )
    .order("timestamp", { ascending: false })
    .limit(limit);

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
