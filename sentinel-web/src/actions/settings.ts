"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTicketPrice() {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: "TICKET_PRICE" },
  });
  return parseInt(setting?.value || "2000", 10);
}

export async function updateTicketPrice(price: number) {
  try {
    if (price < 0) throw new Error("Price cannot be negative");

    await prisma.systemSettings.upsert({
      where: { key: "TICKET_PRICE" },
      update: { value: price.toString() },
      create: { key: "TICKET_PRICE", value: price.toString() },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/manager/dashboard");
    return { success: true, message: "Ticket price updated successfully" };
  } catch (error) {
    return { success: false, message: "Failed to update ticket price" };
  }
}
