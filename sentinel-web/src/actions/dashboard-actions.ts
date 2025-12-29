"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getTicketPrice } from "./settings-actions";
import { requireSuperAdmin } from "@/actions/auth-actions";

// ============================================
// TYPES
// ============================================

export interface DashboardKPIs {
  liveOccupancy: {
    value: number;
    trend: number;
    status: "normal" | "warning" | "critical";
  };
  cashOnHand: {
    value: number;
    currency: string;
  };
  gateVelocity: {
    value: number;
    trend: number;
  };
  securityInterventions: {
    value: number;
  };
}

export interface TrafficDataPoint {
  hour: string;
  entries: number;
  exits: number;
}

export interface PaymentLeaderboardItem {
  managerName: string;
  cashCollected: number;
  studentCount: number;
}

export interface ManagerLiabilityItem {
  id: string;
  name: string;
  section: string | null;
  semester: string | null;
  studentsOnboarded: number;
  cashLiability: number;
  lastActive: Date;
}

// ============================================
// CACHED HELPERS
// ============================================

const getCachedDashboardStats = unstable_cache(
  async () => {
    const ticketPrice = await getTicketPrice();
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // FIX: Fetch capacity from active event instead of hardcoding
    const [
      activeEvent,
      entries,
      exits,
      paidStudents,
      lastHourScans,
      deniedToday,
    ] = await Promise.all([
      prisma.event.findFirst({
        where: { isDefault: true },
        select: { maxCapacity: true },
      }),
      prisma.accessLog.count({
        where: {
          timestamp: { gte: todayStart },
          status: "GRANTED",
          type: "ENTRY",
        },
      }),
      prisma.accessLog.count({
        where: {
          timestamp: { gte: todayStart },
          status: "GRANTED",
          type: "EXIT",
        },
      }),
      prisma.user.count({
        where: { role: "STUDENT", isPaid: true },
      }),
      prisma.accessLog.count({
        where: { timestamp: { gte: oneHourAgo } },
      }),
      prisma.accessLog.count({
        where: {
          timestamp: { gte: todayStart },
          status: "REJECTED",
        },
      }),
    ]);

    const occupancy = entries - exits;
    // Use event capacity if available, fallback to 2000
    const venueCapacity = activeEvent?.maxCapacity ?? 2000;
    const occupancyRate = venueCapacity > 0 ? occupancy / venueCapacity : 0;

    return {
      liveOccupancy: {
        value: occupancy,
        trend: 0,
        status:
          occupancyRate > 0.8
            ? "critical"
            : occupancyRate > 0.6
            ? "warning"
            : "normal",
      },
      cashOnHand: {
        value: paidStudents * ticketPrice,
        currency: "PKR",
      },
      gateVelocity: {
        value: lastHourScans,
        trend: 0,
      },
      securityInterventions: {
        value: deniedToday,
      },
    } as DashboardKPIs;
  },
  ["dashboard-stats"],
  { revalidate: 30, tags: ["dashboard-stats"] }
);

const getCachedTrafficData = unstable_cache(
  async () => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const logs = await prisma.accessLog.findMany({
      where: {
        timestamp: { gte: todayStart },
        status: "GRANTED",
      },
      select: {
        timestamp: true,
        type: true,
      },
    });

    const hourlyMap = new Map<number, { entries: number; exits: number }>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { entries: 0, exits: 0 });
    }

    logs.forEach((log) => {
      const hour = log.timestamp.getHours();
      const current = hourlyMap.get(hour)!;
      if (log.type === "ENTRY") current.entries++;
      else current.exits++;
    });

    return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour: `${hour}:00`,
      entries: data.entries,
      exits: data.exits,
    }));
  },
  ["dashboard-traffic"],
  { revalidate: 60, tags: ["dashboard-traffic"] }
);

const getCachedPaymentLeaderboard = unstable_cache(
  async () => {
    const ticketPrice = await getTicketPrice();
    const managers = await prisma.user.findMany({
      where: { role: { in: ["CR", "GR"] } },
      select: {
        fullName: true,
        sapId: true,
        _count: {
          select: {
            createdUsers: { where: { isPaid: true } },
          },
        },
      },
      take: 50, // Limit query since we only need top 5
    });

    return managers
      .map((m) => ({
        managerName: m.fullName || m.sapId,
        studentCount: m._count.createdUsers,
        cashCollected: m._count.createdUsers * ticketPrice,
      }))
      .sort((a, b) => b.cashCollected - a.cashCollected)
      .slice(0, 5);
  },
  ["dashboard-leaderboard"],
  { revalidate: 300, tags: ["dashboard-leaderboard"] }
);

const getCachedManagerLiability = unstable_cache(
  async () => {
    const ticketPrice = await getTicketPrice();
    const managers = await prisma.user.findMany({
      where: { role: { in: ["CR", "GR"] } },
      select: {
        id: true,
        fullName: true,
        sapId: true,
        section: true,
        semester: true,
        updatedAt: true,
        _count: { select: { createdUsers: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100, // Reasonable limit for liability view
    });

    return managers.map((m) => ({
      id: m.id,
      name: m.fullName || m.sapId,
      section: m.section,
      semester: m.semester,
      studentsOnboarded: m._count.createdUsers,
      cashLiability: m._count.createdUsers * ticketPrice,
      lastActive: m.updatedAt,
    }));
  },
  ["dashboard-liability"],
  { revalidate: 300, tags: ["dashboard-liability"] }
);

// ============================================
// PUBLIC ACTIONS (With Auth)
// ============================================

export async function getDashboardStats(): Promise<DashboardKPIs> {
  await requireSuperAdmin();
  return getCachedDashboardStats();
}

export async function getTrafficData(): Promise<TrafficDataPoint[]> {
  await requireSuperAdmin();
  return getCachedTrafficData();
}

export async function getPaymentLeaderboard(): Promise<
  PaymentLeaderboardItem[]
> {
  await requireSuperAdmin();
  return getCachedPaymentLeaderboard();
}

export async function getManagerLiability(): Promise<ManagerLiabilityItem[]> {
  await requireSuperAdmin();
  return getCachedManagerLiability();
}
