import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding system settings...");

  await prisma.systemSettings.upsert({
    where: { key: "TICKET_PRICE" },
    update: {},
    create: {
      key: "TICKET_PRICE",
      value: "2000",
    },
  });

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
