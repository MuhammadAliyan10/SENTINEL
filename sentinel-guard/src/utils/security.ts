import CryptoJS from "crypto-js";

export interface QrPayload {
  sap: string;
  ts: number;
  sig: string;
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
 * 3. Compare with the provided signature.
 * 4. Check if timestamp is within the allowed window (10 mins).
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
    // Crucial: Ensure ts is treated as a string in the concatenation
    const dataString = `${payload.sap}:${payload.ts}`;

    // 3. Calculate HMAC-SHA256
    const calculatedSig = CryptoJS.HmacSHA256(dataString, secret).toString(
      CryptoJS.enc.Hex
    );

    // 4. Debug Logging (DEV only - never expose secrets in production)
    if (__DEV__) {
      console.log("--- SECURITY CHECK (DEV) ---");
      console.log("Hashing String:", dataString);
      console.log(
        "Sig Match:",
        calculatedSig.toLowerCase() === payload.sig.toLowerCase()
      );
      console.log("----------------------------");
    }

    // 5. Compare Signatures (Case-insensitive)
    if (calculatedSig.toLowerCase() !== payload.sig.toLowerCase()) {
      if (__DEV__) {
        console.warn("SECURITY FAIL: Signature Mismatch");
      }
      return false;
    }

    // 6. Timestamp Check (10 Minutes = 600,000ms)
    const now = Date.now();
    const diff = Math.abs(now - payload.ts);
    const ALLOWED_WINDOW = 10 * 60 * 1000; // 10 minutes

    if (diff > ALLOWED_WINDOW) {
      if (__DEV__) {
        console.warn(
          `SECURITY FAIL: Expired. Diff: ${diff}ms, Allowed: ${ALLOWED_WINDOW}ms`
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
