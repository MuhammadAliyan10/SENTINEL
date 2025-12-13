export interface DashboardMetrics {
  totalRevenue: number;
  totalStudents: number;
  totalManagers: number;
  todayEntries: number;
  activeToday: number;
  insideCampus: number;
  cashCollected: number;
}

export interface ManagerTableRow {
  id: string;
  fullName: string | null;
  sapId: string;
  section: string | null;
  role: "CR" | "GR";
  isActive: boolean;
  cashLiability: number;
  studentsCreated: number;
}

export interface StudentSearchResult {
  id: string;
  sapId: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  isPaid: boolean;
  profileCompleted: boolean;
  accessLogs: {
    id: string;
    timestamp: Date;
    status: string;
  }[];
}
