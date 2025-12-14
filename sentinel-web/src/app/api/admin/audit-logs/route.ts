import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";

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
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const actionType = searchParams.get("actionType") || "ALL";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (search) {
      where.OR = [
        { targetId: { contains: search, mode: "insensitive" } },
        { performer: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (actionType !== "ALL") {
      where.action = actionType;
    }

    if (dateFrom) {
      where.timestamp = {
        ...(where.timestamp as Prisma.DateTimeFilter),
        gte: new Date(dateFrom),
      };
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      where.timestamp = {
        ...(where.timestamp as Prisma.DateTimeFilter),
        lte: endDate,
      };
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          timestamp: true,
          action: true,
          targetId: true,
          details: true,
          ipAddress: true,
          performer: {
            select: {
              fullName: true,
              profilePhotoUrl: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
