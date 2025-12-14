import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { issuePass } from "@/actions/manager-actions";

// ============================================
// TYPES
// ============================================

export interface ManagerStats {
  totalStudents: number;
  ticketPrice: number;
  cashInHand: number;
}

export interface RosterEntry {
  id: string;
  sapId: string;
  fullName: string | null;
  activationToken: string | null;
  createdAt: string;
}

export interface ManagerData {
  stats: ManagerStats;
  roster: RosterEntry[];
  totalCount: number;
}

export interface RegisterStudentInput {
  sapId: string;
  fullName: string;
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetches manager stats (roster count, cash collected)
 */
export function useManagerStats() {
  return useQuery<ManagerStats>({
    queryKey: ["manager-stats"],
    queryFn: async () => {
      const response = await fetch("/api/manager/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch manager stats");
      }
      return response.json();
    },
  });
}

/**
 * Fetches manager roster with pagination
 */
export function useManagerRoster(page: number = 1, limit: number = 10) {
  return useQuery<{ roster: RosterEntry[]; total: number }>({
    queryKey: ["manager-roster", page, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/manager/roster?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch roster");
      }
      return response.json();
    },
  });
}

/**
 * Mutation hook for registering a new student
 * On success, invalidates manager-stats to update cash display instantly
 */
export function useRegisterStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterStudentInput) => {
      const result = await issuePass(input.sapId, input.fullName);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data instantly
      queryClient.invalidateQueries({ queryKey: ["manager-stats"] });
      queryClient.invalidateQueries({ queryKey: ["manager-roster"] });
    },
  });
}
