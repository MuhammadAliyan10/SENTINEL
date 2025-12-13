"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const TICKET_PRICE_KEY = "ticket_price";
const DEFAULT_PRICE = "2000";

export async function getTicketPrice(): Promise<number> {
  try {
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
