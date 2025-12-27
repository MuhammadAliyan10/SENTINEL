/**
 * useOfflineQR Hook
 *
 * Enables offline TOTP-based QR code generation for students.
 * Stores secret in SecureStore and generates new codes every 30 seconds.
 *
 * Usage:
 * const { qrData, timeLeft, isReady, error } = useOfflineQR(userId);
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { TOTP, Secret } from "otpauth";

// Keys for SecureStore
const STORE_KEY_SECRET = "sentinel_qr_secret";
const STORE_KEY_USER_ID = "sentinel_user_id";
const STORE_KEY_SAP_ID = "sentinel_sap_id";

// TOTP Configuration (must match server)
const TOTP_CONFIG = {
  algorithm: "SHA1" as const,
  digits: 6,
  period: 30,
};

// API endpoint for getting secret
const SETUP_QR_ENDPOINT = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/api/student/setup-qr`
  : "/api/student/setup-qr";

interface UseOfflineQRReturn {
  qrData: string | null; // JSON string: { id, code }
  timeLeft: number; // Seconds until next code (0-30)
  isReady: boolean; // True when secret is loaded
  isLoading: boolean; // True during initial setup
  error: string | null;
  refresh: () => Promise<void>; // Force refresh secret from server
}

export function useOfflineQR(): UseOfflineQRReturn {
  const [secret, setSecret] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate TOTP token
  const generateToken = useCallback((secretKey: string): string => {
    try {
      const totp = new TOTP({
        secret: Secret.fromBase32(secretKey),
        algorithm: TOTP_CONFIG.algorithm,
        digits: TOTP_CONFIG.digits,
        period: TOTP_CONFIG.period,
      });
      return totp.generate();
    } catch (e) {
      console.error("TOTP generation error:", e);
      return "000000";
    }
  }, []);

  // Calculate time remaining in current period
  const getTimeLeft = useCallback((): number => {
    const now = Math.floor(Date.now() / 1000);
    return TOTP_CONFIG.period - (now % TOTP_CONFIG.period);
  }, []);

  // Update QR data and time left
  const updateQR = useCallback(() => {
    if (!secret || !userId) return;

    const token = generateToken(secret);
    const data = JSON.stringify({ id: userId, code: token });
    setQrData(data);
    setTimeLeft(getTimeLeft());
  }, [secret, userId, generateToken, getTimeLeft]);

  // Fetch secret from server and save to SecureStore
  const fetchAndSaveSecret = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Import supabase for auth token
      const { supabase } = await import("../src/lib/supabase");

      // Get auth session for Authorization header (required for native)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(SETUP_QR_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch QR secret");
      }

      const data = await response.json();

      if (!data.secret || !data.userId) {
        throw new Error("Invalid response from server");
      }

      // Save to SecureStore
      await SecureStore.setItemAsync(STORE_KEY_SECRET, data.secret);
      await SecureStore.setItemAsync(STORE_KEY_USER_ID, data.userId);
      if (data.sapId) {
        await SecureStore.setItemAsync(STORE_KEY_SAP_ID, data.sapId);
      }

      setSecret(data.secret);
      setUserId(data.userId);
      return true;
    } catch (e: any) {
      setError(e.message || "Failed to setup QR");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load secret from SecureStore or fetch from server
  const loadSecret = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from SecureStore
      const storedSecret = await SecureStore.getItemAsync(STORE_KEY_SECRET);
      const storedUserId = await SecureStore.getItemAsync(STORE_KEY_USER_ID);

      if (storedSecret && storedUserId) {
        setSecret(storedSecret);
        setUserId(storedUserId);
        setIsLoading(false);
        return;
      }

      // No stored secret - fetch from server
      await fetchAndSaveSecret();
    } catch (e: any) {
      setError(e.message || "Failed to load QR secret");
      setIsLoading(false);
    }
  }, [fetchAndSaveSecret]);

  // Force refresh secret from server
  const refresh = useCallback(async () => {
    // Clear stored data
    await SecureStore.deleteItemAsync(STORE_KEY_SECRET);
    await SecureStore.deleteItemAsync(STORE_KEY_USER_ID);
    await SecureStore.deleteItemAsync(STORE_KEY_SAP_ID);
    setSecret(null);
    setUserId(null);
    setQrData(null);

    // Fetch fresh from server
    await fetchAndSaveSecret();
  }, [fetchAndSaveSecret]);

  // Initialize on mount ONLY (no deps to prevent infinite loop)
  useEffect(() => {
    loadSecret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/stop the update interval
  useEffect(() => {
    if (!secret || !userId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Generate initial QR immediately
    updateQR();

    // Update every second
    intervalRef.current = setInterval(() => {
      updateQR();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [secret, userId, updateQR]);

  return {
    qrData,
    timeLeft,
    isReady: !!secret && !!userId && !!qrData,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Clear all stored QR data (for logout)
 */
export async function clearOfflineQRData(): Promise<void> {
  await SecureStore.deleteItemAsync(STORE_KEY_SECRET);
  await SecureStore.deleteItemAsync(STORE_KEY_USER_ID);
  await SecureStore.deleteItemAsync(STORE_KEY_SAP_ID);
}
