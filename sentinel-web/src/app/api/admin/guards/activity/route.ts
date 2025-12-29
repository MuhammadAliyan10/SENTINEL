import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// ================================================================
// PAGINATED GUARD ACTIVITY API ROUTE
// ================================================================
// NEW: Supports pagination, filtering, and search for Guard Activity Logs
// Replaces the old server-side fetch-all approach with scalable pagination

export async function GET(request: Request) {
  try {
    // ================================================================
    // STEP 1: AUTHENTICATION
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
    // STEP 2: PARSE QUERY PARAMETERS
    // ================================================================
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const guardId = searchParams.get("guardId") || undefined;
    const type = searchParams.get("type") || undefined; // "ENTRY" | "EXIT"
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Validate pagination params
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // ================================================================
    // STEP 3: BUILD FILTER CONDITION
    // ================================================================
    const where: any = {
      scannerId: { not: null }, // Only logs performed by guards
    };

    // Filter by specific guard
    if (guardId) {
      where.scannerId = guardId;
    }

    // Filter by type (ENTRY/EXIT)
    if (type && ["ENTRY", "EXIT"].includes(type)) {
      where.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    // ================================================================
    // STEP 4: FETCH PAGINATED DATA
    // ================================================================
    const skip = (page - 1) * pageSize;

    const [logs, totalCount] = await Promise.all([
      // Fetch logs for current page
      prisma.accessLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: "desc" },
        select: {
          id: true,
          type: true,
          status: true,
          timestamp: true,
          scanner: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          user: {
            select: {
              fullName: true,
              sapId: true,
            },
          },
        },
      }),
      // Count total matching records
      prisma.accessLog.count({ where }),
    ]);

    // ================================================================
    // STEP 5: FORMAT RESPONSE
    // ================================================================
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      logs: logs.map((scan) => ({
        id: scan.id,
        type: scan.type,
        status: scan.status,
        timestamp: scan.timestamp.toISOString(),
        guardId: scan.scanner?.id || null,
        guardName: scan.scanner?.fullName || "Unknown",
        guardEmail: scan.scanner?.email || "",
        studentName: scan.user.fullName || "Unknown",
        studentSapId: scan.user.sapId,
      })),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Guard Activity API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guard activity" },
      { status: 500 }
    );
  }
}
