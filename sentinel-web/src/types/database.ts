/**
 * Sentinel Database Types
 * TypeScript interfaces matching the Supabase schema
 */

// ============================================
// ENUMS
// ============================================

export type UserRole = "admin" | "student" | "guard";

export type EntryStatus = "allowed" | "rejected" | "re-entry";

// ============================================
// DATABASE TABLES
// ============================================

/**
 * Profile - Linked to auth.users
 * Stores user information and TOTP credentials
 */
export interface Profile {
  id: string; // UUID from auth.users
  full_name: string;
  sap_id: string; // 8-digit SAP ID (e.g., "70168915") - UNIQUE, NOT NULL
  role: UserRole;
  payment_status: boolean;
  photo_url: string | null;
  totp_secret: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Profile Safe - Without sensitive totp_secret
 * Use this for frontend queries
 */
export type ProfileSafe = Omit<Profile, "totp_secret">;

/**
 * Entry Log - Tracks gate scans
 */
export interface EntryLog {
  id: string; // UUID
  user_id: string; // References profiles.id
  scanned_at: string; // ISO timestamp
  status: EntryStatus;
  guard_device_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: string; // ISO timestamp
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export interface ProfileInsert {
  id?: string; // Optional, can be auto-generated
  full_name: string;
  sap_id: string; // Required, must be unique 8-digit number
  role?: UserRole;
  payment_status?: boolean;
  photo_url?: string | null;
  totp_secret: string;
}

export interface EntryLogInsert {
  user_id: string;
  status: EntryStatus;
  guard_device_id?: string | null;
  location?: string | null;
  notes?: string | null;
  scanned_at?: string; // Defaults to NOW() in DB
}

// ============================================
// UPDATE TYPES (for partial updates)
// ============================================

export interface ProfileUpdate {
  full_name?: string;
  sap_id?: string;
  role?: UserRole;
  payment_status?: boolean;
  photo_url?: string | null;
  totp_secret?: string;
}

export interface EntryLogUpdate {
  status?: EntryStatus;
  notes?: string | null;
}

// ============================================
// VIEW TYPES (for pre-built queries)
// ============================================

/**
 * Today's entry summary
 */
export interface TodayEntrySummary {
  total_entries: number;
  allowed_count: number;
  rejected_count: number;
  reentry_count: number;
}

/**
 * Entry log with user details (admin view)
 */
export interface EntryLogDetailed {
  id: string;
  scanned_at: string;
  status: EntryStatus;
  guard_device_id: string | null;
  location: string | null;
  notes: string | null;
  full_name: string;
  sap_id: string;
  photo_url: string | null;
  payment_status: boolean;
}

// ============================================
// SUPABASE GENERATED TYPES HELPER
// ============================================

/**
 * Database schema type for Supabase client
 * Use with createClient<Database>
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      entry_logs: {
        Row: EntryLog;
        Insert: EntryLogInsert;
        Update: EntryLogUpdate;
      };
    };
    Views: {
      v_today_entries: {
        Row: TodayEntrySummary;
      };
      v_entry_logs_detailed: {
        Row: EntryLogDetailed;
      };
      profiles_safe: {
        Row: ProfileSafe;
      };
    };
    Enums: {
      user_role: UserRole;
      entry_status: EntryStatus;
    };
  };
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * User session with profile data
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  profile: Profile;
}

/**
 * QR Code payload structure
 */
export interface QRPayload {
  uid: string; // User ID
  sap: string; // SAP ID (primary identifier)
  ts: number; // Timestamp (Unix)
  otp: string; // TOTP code
  sig: string; // HMAC signature
}

// ============================================
// BULK IMPORT TYPES
// ============================================

/**
 * CSV row for bulk import
 */
export interface CSVStudentRow {
  sap_id: string;
  full_name: string;
  email?: string;
  payment_status?: string | boolean;
}

/**
 * Processed student ready for database insert
 */
export interface ProcessedStudent {
  sap_id: string;
  full_name: string;
  email: string;
  payment_status: boolean;
  totp_secret: string;
}

/**
 * Bulk import result
 */
export interface BulkImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors: string[];
}
