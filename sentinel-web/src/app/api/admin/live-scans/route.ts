import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // ================================================================
    // STEP 1: VERIFY ADMIN AUTHENTICATION
    // ================================================================
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (dbUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ================================================================
    // STEP 2: CALCULATE REAL-TIME METRICS (TODAY'S DATA)
    // ================================================================
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // NEW: Fetch real-time stats from the database
    const [totalEntered, totalRejected, totalExited] = await Promise.all([
      // Total successful entries today
      prisma.accessLog.count({
        where: {
          timestamp: { gte: todayStart, lte: todayEnd },
          type: "ENTRY",
          status: "GRANTED",
        },
      }),
      // Total rejected entries today
      prisma.accessLog.count({
        where: {
          timestamp: { gte: todayStart, lte: todayEnd },
          status: "REJECTED",
        },
      }),
      // Total successful exits today
      prisma.accessLog.count({
        where: {
          timestamp: { gte: todayStart, lte: todayEnd },
          type: "EXIT",
          status: "GRANTED",
        },
      }),
    ]);

    // Calculate "Currently Inside" = (Entries - Exits) today
    const currentlyInside = totalEntered - totalExited;

    // ================================================================
    // STEP 3: FETCH RECENT SCANS WITH GUARD NAMES (JOIN)
    // ================================================================
    // OLD: Only fetched user (student) info
    // NEW: Include scannedBy (guard) information via Prisma relation
    const scans = await prisma.accessLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 20, // Increased from 5 to 20 for better context
      select: {
        id: true,
        timestamp: true,
        status: true,
        type: true,
        // Student who was scanned
        user: {
          select: {
            fullName: true,
            sapId: true,
            profilePhotoUrl: true,
          },
        },
        // NEW: Guard who performed the scan (join)
        scanner: {
          select: {
            fullName: true,
            sapId: true,
          },
        },
      },
    });

    // ================================================================
    // STEP 4: RETURN ENHANCED RESPONSE
    // ================================================================
    return NextResponse.json({
      scans,
      stats: {
        totalEntered,
        currentlyInside: Math.max(0, currentlyInside), // Prevent negative values
        rejected: totalRejected,
      },
    });
  } catch (error) {
    console.error("Live scans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scans" },
      { status: 500 }
    );
  }
}
