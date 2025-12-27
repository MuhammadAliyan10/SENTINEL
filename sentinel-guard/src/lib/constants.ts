// ============================================
// SENTINEL Mobile - Shared Constants
// ============================================
// Mirror of web constants for consistency
// Import from here instead of hardcoding values

export const TIME = {
  // QR Code Configuration
  QR_VALIDITY_MS: 2 * 60 * 1000, // 2 minutes - must match web
  QR_REFRESH_INTERVAL_MS: 60 * 1000, // 60 seconds

  // Network
  NETWORK_TIMEOUT_MS: 10 * 1000, // 10 seconds API timeout
  OFFLINE_SYNC_BATCH_SIZE: 20, // logs per sync batch

  // Rate Limiting
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes

  // Access Log
  ACCESS_LOG_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours for duplicate checking
} as const;

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

export const ROLES = {
  GUARD: "GUARD",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

// Roles allowed to use the Guard mobile app
export const AUTHORIZED_ROLES = [ROLES.GUARD, ROLES.SUPER_ADMIN] as const;
