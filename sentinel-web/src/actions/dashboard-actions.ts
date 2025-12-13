"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { getTicketPrice } from "./settings-actions";

// ============================================
// TYPES
// ============================================

export interface DashboardKPIs {
  liveOccupancy: {
    value: number;
    trend: number; // Placeholder for now, or calc diff from yesterday
    status: "normal" | "warning" | "critical";
  };
  cashOnHand: {
    value: number;
    currency: string;
  };
  gateVelocity: {
    value: number; // Scans in last hour
    trend: number;
  };
  securityInterventions: {
    value: number; // Denied scans today
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
  studentsOnboarded: number;
  cashLiability: number;
  lastActive: Date;
}

// ============================================
// HELPERS
// ============================================

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
}

// ============================================
// ACTIONS
// ============================================

export async function getDashboardStats(): Promise<DashboardKPIs> {
  await requireAdmin();
  const ticketPrice = await getTicketPrice();

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [entries, exits, paidStudents, lastHourScans, deniedToday] =
    await Promise.all([
      // Live Occupancy (Total Entries - Total Exits today)
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
      // Cash on Hand
      prisma.user.count({
        where: {
          role: "STUDENT",
          isPaid: true,
        },
      }),
      // Gate Velocity
      prisma.accessLog.count({
        where: {
          timestamp: { gte: oneHourAgo },
        },
      }),
      // Security Interventions
      prisma.accessLog.count({
        where: {
          timestamp: { gte: todayStart },
          status: "REJECTED",
        },
      }),
    ]);

  const occupancy = entries - exits;
  const occupancyRate = occupancy / 2000; // Assuming 2000 capacity for now

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
  };
}

export async function getTrafficData(): Promise<TrafficDataPoint[]> {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  // Get all logs for today
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

  // Group by hour
  const hourlyMap = new Map<number, { entries: number; exits: number }>();

  // Initialize all hours 0-23
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { entries: 0, exits: 0 });
  }

  logs.forEach((log) => {
    const hour = log.timestamp.getHours();
    const current = hourlyMap.get(hour)!;
    if (log.type === "ENTRY") current.entries++;
    else current.exits++;
  });

  // Convert to array
  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour: `${hour}:00`,
    entries: data.entries,
    exits: data.exits,
  }));
}

export async function getPaymentLeaderboard(): Promise<
  PaymentLeaderboardItem[]
> {
  await requireAdmin();
  const ticketPrice = await getTicketPrice();

  const managers = await prisma.user.findMany({
    where: {
      role: { in: ["CR", "GR"] },
    },
    select: {
      fullName: true,
      sapId: true,
      _count: {
        select: {
          createdUsers: {
            where: { isPaid: true },
          },
        },
      },
    },
    // We can't sort by relation count easily in Prisma without raw query or in-memory sort
    // For top 5, in-memory is fine if manager count is low (<100)
  });

  return managers
    .map((m) => ({
      managerName: m.fullName || m.sapId,
      studentCount: m._count.createdUsers,
      cashCollected: m._count.createdUsers * ticketPrice,
    }))
    .sort((a, b) => b.cashCollected - a.cashCollected)
    .slice(0, 5);
}

export async function getManagerLiability(): Promise<ManagerLiabilityItem[]> {
  await requireAdmin();
  const ticketPrice = await getTicketPrice();

  const managers = await prisma.user.findMany({
    where: {
      role: { in: ["CR", "GR"] },
    },
    select: {
      id: true,
      fullName: true,
      sapId: true,
      section: true,
      updatedAt: true,
      _count: {
        select: {
          createdUsers: true, // Total students created = Total Liability
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return managers.map((m) => ({
    id: m.id,
    name: m.fullName || m.sapId,
    section: m.section,
    studentsOnboarded: m._count.createdUsers,
    cashLiability: m._count.createdUsers * ticketPrice,
    lastActive: m.updatedAt,
  }));
}
