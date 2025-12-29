import CryptoJS from "crypto-js";
import { TIME } from "../lib/constants";

export interface QrPayload {
  sap: string;
  ts: number;
  sig: string;
}

/**
 * Timing-safe string comparison (prevents timing attacks)
 * Uses constant-time XOR comparison algorithm.
 * In React Native, we can't use Node's timingSafeEqual,
 * so we implement our own constant-time comparison.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Parses the raw QR code string into a JSON object.
 */
export function parseQrData(data: string): QrPayload | null {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.sap || !parsed.ts || !parsed.sig) return null;
    return parsed;
  } catch (e) {
    if (__DEV__) {
      console.error("QR Parse Error:", e);
    }
    return null;
  }
}

/**
 * Verifies the HMAC-SHA256 signature of the QR code.
 *
 * Logic:
 * 1. Construct data string: `${sap}:${ts}`
 * 2. Hash using the User's Secret (activation_token).
 * 3. Compare with the provided signature (TIMING-SAFE).
 * 4. Check if timestamp is within the allowed window.
 *
 * SECURITY: Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyQrSignature(payload: QrPayload, secret: string): boolean {
  try {
    // 1. Validate Secret
    if (!secret) {
      if (__DEV__) {
        console.error("SECURITY ERROR: Secret (activation_token) is missing!");
      }
      return false;
    }

    // 2. Construct Data String
    const dataString = `${payload.sap}:${payload.ts}`;

    // 3. Calculate HMAC-SHA256
    const calculatedSig = CryptoJS.HmacSHA256(dataString, secret).toString(
      CryptoJS.enc.Hex
    );

    // 4. Debug Logging (DEV only - never expose secrets in production)
    if (__DEV__) {
      console.log("--- SECURITY CHECK (DEV) ---");
      console.log("Hashing String:", dataString);
      console.log("----------------------------");
    }

    // 5. TIMING-SAFE Compare Signatures (prevents timing attacks)
    const sigMatch = safeCompare(
      calculatedSig.toLowerCase(),
      payload.sig.toLowerCase()
    );

    if (!sigMatch) {
      if (__DEV__) {
        console.warn("SECURITY FAIL: Signature Mismatch");
      }
      return false;
    }

    // === TIMESTAMP VALIDATION (SECURITY CRITICAL) ===
    // Check if QR code is within the allowed validity window
    // Uses shared constant to ensure sync with web API
    const now = Date.now();
    const diff = Math.abs(now - payload.ts);

    if (diff > TIME.QR_VALIDITY_MS) {
      if (__DEV__) {
        console.warn(
          `SECURITY FAIL: Expired. Diff: ${diff}ms, Allowed: ${TIME.QR_VALIDITY_MS}ms`
        );
      }
      return false;
    }

    if (__DEV__) {
      console.log("SECURITY PASS: Valid Signature & Timestamp");
    }
    return true;
  } catch (e) {
    if (__DEV__) {
      console.error("Verification Error:", e);
    }
    return false;
  }
}
