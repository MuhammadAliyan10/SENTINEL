import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Initialize Supabase Admin (Bypasses RLS for Auth Management)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🚀 Starting Sentinel System Seeder...");

  const ADMIN_EMAIL = "admin@sentinel.edu";
  // Generates a random secure password
  const password = crypto.randomBytes(12).toString("base64").slice(0, 16) + "!";

  // ======================================================
  // 1. MANAGE SUPABASE AUTH USER
  // ======================================================
  console.log("🔐 Checking Supabase Auth...");

  let authUserId: string;

  // Search for existing user in Auth
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();
  const existingAuthUser = users.find((u) => u.email === ADMIN_EMAIL);

  if (existingAuthUser) {
    console.log("   ↳ Found existing Auth user. Updating password...");
    authUserId = existingAuthUser.id;
    // Reset password so you can definitely log in
    await supabase.auth.admin.updateUserById(authUserId, {
      password: password,
      user_metadata: { role: "SUPER_ADMIN" },
    });
  } else {
    console.log("   ↳ Creating new Auth user...");
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: password,
      email_confirm: true,
      user_metadata: { role: "SUPER_ADMIN" },
    });

    if (error) throw new Error(`Supabase Auth Error: ${error.message}`);
    authUserId = newUser.user.id;
  }

  // ======================================================
  // 2. MANAGE DATABASE USER (PRISMA)
  // ======================================================
  console.log("💾 Syncing Public Database Record...");

  // Use UPSERT: Create if missing, Update if exists
  await prisma.user.upsert({
    where: { id: authUserId }, // Look for this ID
    update: {
      // If found, ensure they are an Admin
      role: "SUPER_ADMIN",
      isActive: true,
      sapId: "SUPER-ADMIN", // Ensure this is consistent
    },
    create: {
      // If not found, create new
      id: authUserId,
      sapId: "SUPER-ADMIN",
      fullName: "System Administrator",
      role: "SUPER_ADMIN",
      isActive: true,
      isPaid: true,
      profileCompleted: true,
    },
  });

  // ======================================================
  // 3. SEED DEFAULT EVENT (CRITICAL FOR DASHBOARD)
  // ======================================================
  console.log("📅 Checking Active Event...");

  const existingEvent = await prisma.event.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!existingEvent) {
    console.log("   ↳ No active event found. Creating default...");
    await prisma.event.create({
      data: {
        name: "System Launch 2025",
        date: new Date(),
        ticketPrice: 1800,
        maxCapacity: 1000,
        status: "ACTIVE",
        isDefault: true,
      },
    });
  } else {
    console.log("   ↳ Active event already exists.");
  }

  // ======================================================
  // 4. OUTPUT CREDENTIALS
  // ======================================================
  console.log("\n" + "=".repeat(50));
  console.log("✅  SYSTEM SEEDED SUCCESSFULLY");
  console.log("=".repeat(50));
  console.log(`📧 Login:    ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${password}`);
  console.log("=".repeat(50));
  console.log("⚠️  SAVE THIS PASSWORD. It was randomly generated.");
  console.log("=".repeat(50) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
