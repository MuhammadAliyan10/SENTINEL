// ============================================
// SENTINEL - Shared Constants
// ============================================
// Single source of truth for all magic numbers and strings
// Import from here instead of hardcoding values

// ============================================
// TIME CONSTANTS (in milliseconds)
// ============================================

export const TIME = {
  // QR Code Configuration
  QR_VALIDITY_MS: 2 * 60 * 1000, // 2 minutes - QR expiration window
  QR_REFRESH_INTERVAL_MS: 60 * 1000, // 60 seconds - how often to refresh QR

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes - lockout duration
  MAX_FAILED_ATTEMPTS: 5, // attempts before lockout

  // Polling & Caching
  DASHBOARD_POLL_INTERVAL_MS: 30 * 1000, // 30 seconds for dashboard stats
  SESSION_CACHE_TTL_MS: 30 * 1000, // 30 seconds session cache
  REALTIME_FALLBACK_INTERVAL_MS: 5 * 1000, // 5 seconds fallback poll when realtime down
  REALTIME_BACKUP_INTERVAL_MS: 15 * 1000, // 15 seconds backup poll when realtime up

  // Network
  NETWORK_TIMEOUT_MS: 10 * 1000, // 10 seconds API timeout
  OFFLINE_SYNC_BATCH_SIZE: 20, // logs per sync batch

  // Access Log
  ACCESS_LOG_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours for duplicate checking
} as const;

// ============================================
// USER ROLES
// ============================================

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  CR: "CR",
  GR: "GR",
  GUARD: "GUARD",
  STUDENT: "STUDENT",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// Roles allowed to use the Guard mobile app
export const GUARD_APP_AUTHORIZED_ROLES: UserRole[] = [
  ROLES.GUARD,
  ROLES.SUPER_ADMIN,
];

// Roles allowed to access admin dashboard
export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN];

// Roles allowed to access manager dashboard
export const MANAGER_ROLES: UserRole[] = [ROLES.CR, ROLES.GR];

// ============================================
// SCAN TYPES & STATUSES
// ============================================

export const SCAN_TYPE = {
  ENTRY: "ENTRY",
  EXIT: "EXIT",
} as const;

export type ScanType = (typeof SCAN_TYPE)[keyof typeof SCAN_TYPE];

export const SCAN_STATUS = {
  GRANTED: "GRANTED",
  REJECTED: "REJECTED",
  DUPLICATE: "DUPLICATE",
} as const;

export type ScanStatus = (typeof SCAN_STATUS)[keyof typeof SCAN_STATUS];

// ============================================
// ACCESS STATES (for UI)
// ============================================

export const ACCESS_STATE = {
  OUTSIDE: "OUTSIDE",
  INSIDE: "INSIDE",
  LOADING: "LOADING",
} as const;

export type AccessState = (typeof ACCESS_STATE)[keyof typeof ACCESS_STATE];

// ============================================
// ERROR CODES
// ============================================

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_DEACTIVATED: "ACCOUNT_DEACTIVATED",
  UNAUTHORIZED_ROLE: "UNAUTHORIZED_ROLE",

  // Scan errors
  QR_EXPIRED: "QR_EXPIRED",
  QR_INVALID: "QR_INVALID",
  SIGNATURE_MISMATCH: "SIGNATURE_MISMATCH",
  STUDENT_NOT_FOUND: "STUDENT_NOT_FOUND",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  ALREADY_INSIDE: "ALREADY_INSIDE",
  NOT_INSIDE: "NOT_INSIDE",

  // System errors
  NETWORK_ERROR: "NETWORK_ERROR",
  DB_ERROR: "DB_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

// ============================================
// VENUE CONFIGURATION
// ============================================

export const VENUE = {
  DEFAULT_CAPACITY: 2000, // Default max capacity
  EVENT_NAME: "Annual Dinner 2026",
  DEPARTMENT: "Department of Computer Science",
} as const;

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION = {
  SAP_ID_MIN_LENGTH: 6,
  SAP_ID_MAX_LENGTH: 10,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  TOKEN_LENGTH: 6, // Activation token length
} as const;
