import { useQuery } from "@tanstack/react-query";

// ============================================
// TYPES
// ============================================

export interface DashboardStats {
  liveOccupancy: number;
  maxCapacity: number;
  totalScansToday: number;
  securityAlerts: number;
  revenue: number;
}

export interface TrafficDataPoint {
  hour: string;
  entries: number;
}

export interface LiveScan {
  id: string;
  timestamp: string;
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  user: {
    fullName: string | null;
    profilePhotoUrl: string | null;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  hourlyTraffic: TrafficDataPoint[];
  liveScans: LiveScan[];
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetches dashboard stats with live polling every 5 seconds
 */
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

/**
 * Fetches live scans with polling every 5 seconds
 */
export function useLiveScans() {
  return useQuery<{ scans: LiveScan[] }>({
    queryKey: ["live-scans"],
    queryFn: async () => {
      const response = await fetch("/api/admin/live-scans");
      if (!response.ok) {
        throw new Error("Failed to fetch live scans");
      }
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

/**
 * Fetches traffic data for charts
 */
export function useTrafficData() {
  return useQuery<{ traffic: TrafficDataPoint[] }>({
    queryKey: ["traffic-data"],
    queryFn: async () => {
      const response = await fetch("/api/admin/traffic");
      if (!response.ok) {
        throw new Error("Failed to fetch traffic data");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
