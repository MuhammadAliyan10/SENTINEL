// ============================================
// SENTINEL Mobile - API Client
// ============================================
// Centralized API calls with hybrid online/offline support

import { supabase } from "./supabase";
import { TIME } from "./constants";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

// ============================================
// AUTH HELPERS
// ============================================

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// ============================================
// TYPES
// ============================================

export interface VerifyResponse {
  success: boolean;
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  reason?: string;
  student?: {
    id: string;
    sapId: string;
    fullName: string | null;
    section: string | null;
    semester: string | null;
    profilePhotoUrl: string | null;
  };
  isReturning?: boolean;
  verifiedOffline?: boolean;
}

// ============================================
// HYBRID VERIFICATION
// ============================================

/**
 * HYBRID VERIFICATION:
 * 1. Try online first (most secure)
 * 2. Fallback to offline if network fails (most reliable)
 * 3. Sync offline logs when connection returns
 *
 * @param qrData - Raw QR code string
 * @param scanType - 'ENTRY' or 'EXIT'
 * @param offlineVerifier - Function to verify offline (uses local HMAC)
 */
export async function verifyQrHybrid(
  qrData: string,
  scanType: "ENTRY" | "EXIT",
  offlineVerifier: (qrData: string) => Promise<VerifyResponse | null>
): Promise<VerifyResponse> {
  const token = await getAccessToken();
  console.log("[Hybrid] Token available:", !!token); // Debug log

  // No session = must be offline (shouldn't happen, but handle gracefully)
  if (!token) {
    console.log("[Hybrid] No token, trying offline verification");
    const offlineResult = await offlineVerifier(qrData);
    if (offlineResult) {
      return { ...offlineResult, verifiedOffline: true };
    }
    return { success: false, status: "REJECTED", reason: "NOT_AUTHENTICATED" };
  }

  // Check if API URL is configured
  if (!API_BASE_URL) {
    console.log("[Hybrid] No API URL configured, using offline verification");
    const offlineResult = await offlineVerifier(qrData);
    if (offlineResult) {
      return { ...offlineResult, verifiedOffline: true };
    }
    return { success: false, status: "REJECTED", reason: "API_NOT_CONFIGURED" };
  }

  // Try online verification with timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      TIME.NETWORK_TIMEOUT_MS
    );

    const response = await fetch(`${API_BASE_URL}/api/guard/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qrData, scanType }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    // If 401, try to refresh session and retry ONCE
    if (error.message.includes("401")) {
      console.log("[Hybrid] 401 received, attempting token refresh...");
      const { data, error: refreshError } =
        await supabase.auth.refreshSession();

      if (!refreshError && data.session) {
        const newToken = data.session.access_token;
        console.log("[Hybrid] Token refreshed, retrying request...");

        try {
          const retryResponse = await fetch(
            `${API_BASE_URL}/api/guard/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({ qrData, scanType }),
            }
          );

          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        } catch (retryErr) {
          console.log("[Hybrid] Retry failed:", retryErr);
        }
      } else {
        console.log("[Hybrid] Token refresh failed:", refreshError);
      }
    }

    // Network failed - fallback to offline verification
    console.log("[Hybrid] Online failed, trying offline:", error.message);

    const offlineResult = await offlineVerifier(qrData);
    if (offlineResult) {
      return { ...offlineResult, verifiedOffline: true };
    }

    return {
      success: false,
      status: "REJECTED",
      reason: error.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR",
    };
  }
}
