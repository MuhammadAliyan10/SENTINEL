"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { z } from "zod";

// ============================================
// TICKET PRICE (Legacy - use Event model for new implementations)
// ============================================

const TICKET_PRICE_KEY = "ticket_price";
const DEFAULT_PRICE = "2000";

export async function getTicketPrice(): Promise<number> {
  try {
    // First try to get from active event
    const activeEvent = await prisma.event.findFirst({
      where: { isDefault: true },
      select: { ticketPrice: true },
    });

    if (activeEvent) {
      return activeEvent.ticketPrice;
    }

    // Fallback to system settings
    const setting = await prisma.systemSettings.findUnique({
      where: { key: TICKET_PRICE_KEY },
    });

    return parseInt(setting?.value || DEFAULT_PRICE, 10);
  } catch (error) {
    console.error("Failed to fetch ticket price:", error);
    return parseInt(DEFAULT_PRICE, 10);
  }
}

export async function updateTicketPrice(
  price: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // SECURITY: Require SUPER_ADMIN authentication
    await requireSuperAdmin();

    if (price < 0) {
      return { success: false, error: "Price cannot be negative" };
    }

    await prisma.systemSettings.upsert({
      where: { key: TICKET_PRICE_KEY },
      update: { value: price.toString() },
      create: { key: TICKET_PRICE_KEY, value: price.toString() },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/manager/dashboard"); // Update manager stats
    return { success: true };
  } catch (error) {
    console.error("Failed to update ticket price:", error);
    return { success: false, error: "Failed to update price" };
  }
}

// ============================================
// EVENT MANAGEMENT (Dynamic Event Configuration)
// ============================================

const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  venue: z.string().optional(),
  date: z.string().datetime(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  maxCapacity: z.number().int().positive().optional(),
  ticketPrice: z.number().int().min(0).default(2000),
});

export type EventInput = z.infer<typeof eventSchema>;

export interface EventData {
  id: string;
  name: string;
  venue: string | null;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  ticketPrice: number;
  maxCapacity: number | null;
  status: string;
  isDefault: boolean;
  primaryColor: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
}

/**
 * Get the current active event
 */
export async function getActiveEvent(): Promise<EventData | null> {
  try {
    const event = await prisma.event.findFirst({
      where: { isDefault: true },
    });

    return event;
  } catch (error) {
    console.error("Failed to fetch active event:", error);
    return null;
  }
}

/**
 * Get all events
 * SECURITY: Requires SUPER_ADMIN
 */
export async function getAllEvents(): Promise<EventData[]> {
  await requireSuperAdmin();

  return prisma.event.findMany({
    orderBy: { date: "desc" },
  });
}

/**
 * Create a new event
 * SECURITY: Requires SUPER_ADMIN
 */
export async function createEvent(
  input: EventInput
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    await requireSuperAdmin();

    const validation = eventSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const data = validation.data;

    const event = await prisma.event.create({
      data: {
        name: data.name,
        venue: data.venue || null,
        date: new Date(data.date),
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        bannerUrl: data.bannerUrl || null,
        primaryColor: data.primaryColor || null,
        maxCapacity: data.maxCapacity || null,
        ticketPrice: data.ticketPrice,
        status: "DRAFT",
        isDefault: false,
      },
    });

    revalidatePath("/admin/settings");

    return { success: true, eventId: event.id };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

/**
 * Update an existing event
 * SECURITY: Requires SUPER_ADMIN
 */
export async function updateEvent(
  eventId: string,
  input: Partial<EventInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        name: input.name,
        venue: input.venue,
        date: input.date ? new Date(input.date) : undefined,
        startTime: input.startTime ? new Date(input.startTime) : undefined,
        endTime: input.endTime ? new Date(input.endTime) : undefined,
        description: input.description,
        logoUrl: input.logoUrl,
        bannerUrl: input.bannerUrl,
        primaryColor: input.primaryColor,
        maxCapacity: input.maxCapacity,
        ticketPrice: input.ticketPrice,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/student"); // Update student passes

    return { success: true };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Set an event as the active/default event
 * SECURITY: Requires SUPER_ADMIN
 */
export async function setActiveEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Clear any existing default
      prisma.event.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      }),
      // Set new default
      prisma.event.update({
        where: { id: eventId },
        data: { isDefault: true, status: "PUBLISHED" },
      }),
    ]);

    revalidatePath("/admin/settings");
    revalidatePath("/student");
    revalidatePath("/manager/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to set active event:", error);
    return { success: false, error: "Failed to set active event" };
  }
}

/**
 * Update event status
 * SECURITY: Requires SUPER_ADMIN
 */
export async function updateEventStatus(
  eventId: string,
  status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();

    await prisma.event.update({
      where: { id: eventId },
      data: { status },
    });

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to update event status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

// ============================================
// SYSTEM SETTINGS
// ============================================

export async function updateSystemSetting(
  key: string,
  value: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireSuperAdmin();

    await prisma.systemSettings.upsert({
      where: { key },
      update: { value: value.toString() },
      create: { key, value: value.toString() },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update system setting:", error);
    return { success: false, message: "Failed to update setting" };
  }
}

export async function getSystemSettings(): Promise<{
  allowStudentLogin: boolean;
  enableRegistrations: boolean;
  strictGateMode: boolean;
}> {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ["allowStudentLogin", "enableRegistrations", "strictGateMode"],
        },
      },
    });

    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value === "true"])
    );

    return {
      allowStudentLogin: settingsMap.allowStudentLogin ?? true,
      enableRegistrations: settingsMap.enableRegistrations ?? true,
      strictGateMode: settingsMap.strictGateMode ?? false,
    };
  } catch (error) {
    console.error("Failed to get system settings:", error);
    return {
      allowStudentLogin: true,
      enableRegistrations: true,
      strictGateMode: false,
    };
  }
}

// ============================================
// DANGER ZONE
// ============================================

export async function purgeTestData(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await requireSuperAdmin();

    const result = await prisma.accessLog.deleteMany({});

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath("/admin/logs");

    return {
      success: true,
      message: `Purged ${result.count} access logs successfully`,
    };
  } catch (error) {
    console.error("Failed to purge test data:", error);
    return { success: false, message: "Failed to purge data" };
  }
}
