import { useQuery } from "@tanstack/react-query";

// ============================================
// TYPES
// ============================================

export interface StudentProfile {
  id: string;
  sapId: string;
  fullName: string | null;
  profilePhotoUrl: string | null;
  isPaid: boolean;
  semester: string | null;
  section: string | null;
  department: string | null;
}

export interface QRPayload {
  payload: string;
  expiresAt: number;
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetches student profile information
 * Profile data is cached for 1 hour since it rarely changes
 */
export function useStudentProfile() {
  return useQuery<StudentProfile>({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const response = await fetch("/api/student/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 Hour - profile data rarely changes
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });
}

/**
 * Fetches a fresh signed QR payload every 15 seconds
 * This prevents screenshot/replay attacks by rotating the timestamp and signature
 */
export function useLiveQR() {
  return useQuery<QRPayload>({
    queryKey: ["live-qr"],
    queryFn: async () => {
      const response = await fetch("/api/qr/generate");
      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }
      return response.json();
    },
    refetchInterval: 15000, // Rotate every 15 seconds
    refetchOnWindowFocus: true, // Refresh when user comes back
    refetchIntervalInBackground: false, // Don't waste resources when hidden
  });
}
