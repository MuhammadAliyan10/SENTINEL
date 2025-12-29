// ============================================
// SENTINEL - HMAC Signature Utility
// ============================================
// Single source of truth for QR code signature generation and verification
// Used by: web (student-actions.ts, security-actions.ts), mobile (security.ts)

import { createHmac, timingSafeEqual } from "crypto";
import { TIME } from "@/lib/constants";

// ============================================
// TYPES
// ============================================

export interface QrPayload {
  sap: string; // SAP ID
  ts: number; // Timestamp (ms since epoch)
  sig: string; // HMAC signature
}

export interface SignatureResult {
  valid: boolean;
  reason?: string;
}

// ============================================
// SIGNATURE GENERATION
// ============================================

/**
 * Generate HMAC-SHA256 signature for QR code payload
 * @param sapId - Student SAP ID
 * @param timestamp - Timestamp in milliseconds
 * @param secret - Student's activation token
 */
export function generateSignature(
  sapId: string,
  timestamp: number,
  secret: string
): string {
  const dataString = `${sapId}:${timestamp}`;
  return createHmac("sha256", secret).update(dataString).digest("hex");
}

/**
 * Generate complete QR payload
 */
export function generateQrPayload(sapId: string, secret: string): QrPayload {
  const timestamp = Date.now();
  const signature = generateSignature(sapId, timestamp, secret);

  return {
    sap: sapId,
    ts: timestamp,
    sig: signature,
  };
}

/**
 * Generate QR payload as JSON string (for QRCode component)
 */
export function generateQrString(sapId: string, secret: string): string {
  return JSON.stringify(generateQrPayload(sapId, secret));
}

// ============================================
// SIGNATURE VERIFICATION (TIMING-SAFE)
// ============================================

/**
 * Timing-safe comparison of two HMAC signatures
 * Prevents timing attacks by ensuring constant-time comparison
 */
export function safeHmacCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Normalize to lowercase for comparison
  const bufA = Buffer.from(a.toLowerCase(), "hex");
  const bufB = Buffer.from(b.toLowerCase(), "hex");

  // Different lengths = different signatures
  if (bufA.length !== bufB.length) {
    return false;
  }

  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verify QR code signature and expiration
 * @param payload - Parsed QR payload
 * @param secret - Student's activation token
 * @param maxAgeMs - Maximum age in milliseconds (default: QR_VALIDITY_MS)
 */
export function verifySignature(
  payload: QrPayload,
  secret: string,
  maxAgeMs: number = TIME.QR_VALIDITY_MS
): SignatureResult {
  // Validate inputs
  if (!payload.sap || !payload.ts || !payload.sig) {
    return { valid: false, reason: "INVALID_PAYLOAD" };
  }

  if (!secret) {
    return { valid: false, reason: "MISSING_SECRET" };
  }

  // Check timestamp freshness
  const now = Date.now();
  const age = now - payload.ts;

  if (age > maxAgeMs) {
    return { valid: false, reason: "QR_EXPIRED" };
  }

  // Prevent future timestamps (clock manipulation)
  if (age < -30000) {
    // Allow 30s clock skew
    return { valid: false, reason: "INVALID_TIMESTAMP" };
  }

  // Generate expected signature
  const expectedSig = generateSignature(payload.sap, payload.ts, secret);

  // Timing-safe comparison
  if (!safeHmacCompare(payload.sig, expectedSig)) {
    return { valid: false, reason: "SIGNATURE_MISMATCH" };
  }

  return { valid: true };
}

/**
 * Parse QR code string to payload
 */
export function parseQrPayload(qrString: string): QrPayload | null {
  try {
    const parsed = JSON.parse(qrString);
    if (!parsed.sap || !parsed.ts || !parsed.sig) {
      return null;
    }
    return {
      sap: String(parsed.sap),
      ts: Number(parsed.ts),
      sig: String(parsed.sig),
    };
  } catch {
    return null;
  }
}

// ============================================
// TIMING-SAFE STRING COMPARISON
// ============================================

/**
 * Timing-safe comparison for general strings (e.g., activation tokens)
 * Use this for token validation to prevent timing attacks
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Pad to same length to prevent length-based timing leak
  const maxLen = Math.max(a.length, b.length);
  const paddedA = a.padEnd(maxLen, "\0");
  const paddedB = b.padEnd(maxLen, "\0");

  const bufA = Buffer.from(paddedA, "utf8");
  const bufB = Buffer.from(paddedB, "utf8");

  try {
    return timingSafeEqual(bufA, bufB) && a.length === b.length;
  } catch {
    return false;
  }
}
