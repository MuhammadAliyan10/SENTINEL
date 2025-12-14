import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // Fetch last 5 scans
    const scans = await prisma.accessLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 5,
      select: {
        id: true,
        timestamp: true,
        status: true,
        user: {
          select: {
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ scans });
  } catch (error) {
    console.error("Live scans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scans" },
      { status: 500 }
    );
  }
}
