import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Seed System Settings
  const ticketPrice = await prisma.systemSettings.upsert({
    where: { key: "TICKET_PRICE" },
    update: {},
    create: {
      key: "TICKET_PRICE",
      value: "2000",
    },
  });

  console.log(`✅ System Settings seeded: TICKET_PRICE = ${ticketPrice.value}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
