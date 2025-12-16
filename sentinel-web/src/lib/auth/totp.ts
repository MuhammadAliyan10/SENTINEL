/**
 * TOTP (Time-based One-Time Password) Utilities
 *
 * Used for offline QR code generation and verification.
 * Compatible with Google Authenticator protocol.
 */

import { TOTP, Secret } from "otpauth";

// TOTP Configuration
const TOTP_CONFIG = {
  algorithm: "SHA1",
  digits: 6,
  period: 30, // 30 seconds per code
} as const;

/**
 * Generate a new random Base32 secret for TOTP
 * @returns 20-character Base32 encoded secret
 */
export function generateSecret(): string {
  // Generate random bytes and encode as Base32
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

/**
 * Verify a TOTP token against a secret
 * @param secret - Base32 encoded secret
 * @param token - 6-digit code from user
 * @returns true if valid, false otherwise
 *
 * CRITICAL: window=2 allows ±60 seconds drift for bad phone clocks
 */
export function verifyToken(secret: string, token: string): boolean {
  try {
    // Validate inputs
    if (!secret || !token) return false;
    if (!/^\d{6}$/.test(token)) return false;

    const totp = new TOTP({
      secret: Secret.fromBase32(secret),
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
    });

    // window=2 allows checking previous and next 2 intervals (±60 seconds)
    const delta = totp.validate({ token, window: 2 });

    // validate() returns null if invalid, or the time drift delta if valid
    return delta !== null;
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
}

/**
 * Generate a TOTP token (for testing purposes only)
 * @param secret - Base32 encoded secret
 * @returns 6-digit code
 */
export function generateToken(secret: string): string {
  const totp = new TOTP({
    secret: Secret.fromBase32(secret),
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
  });

  return totp.generate();
}
