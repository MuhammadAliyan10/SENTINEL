import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma, ScanStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Verify admin
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const filter = searchParams.get("filter") || "all";

    // Build where clause with proper Prisma types
    const where: Prisma.AccessLogWhereInput = {};

    if (filter === "alerts") {
      where.status = { in: [ScanStatus.REJECTED, ScanStatus.DUPLICATE] };
    } else if (filter === "staff") {
      where.user = { role: { in: ["CR", "GR", "GUARD"] } };
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          timestamp: true,
          status: true,
          gateNumber: true,
          user: {
            select: {
              fullName: true,
              sapId: true,
              role: true,
              profilePhotoUrl: true,
            },
          },
        },
      }),
      prisma.accessLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error("Activity logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
