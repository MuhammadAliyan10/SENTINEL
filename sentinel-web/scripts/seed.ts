import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Initialize Supabase Admin (Bypasses RLS)
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
  console.log("🚀 Starting Sentinel Admin Seeder...");

  const ADMIN_EMAIL = "admin@sentinel.edu";

  // 1. Check if user already exists in Prisma
  const existingUser = await prisma.user.findUnique({
    where: { sapId: "SUPER-ADMIN" },
  });

  if (existingUser) {
    console.log("⚠️  Super Admin already exists in Database.");
    return;
  }

  // 2. Generate a High-Entropy Password (16 chars)
  const password = crypto.randomBytes(12).toString("base64").slice(0, 16) + "!";

  // 3. Create User in Supabase Auth
  console.log("🔐 Creating Supabase Auth User...");

  // First, try to get the user if they exist in Auth but not DB (Edge case)
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();
  const existingAuthUser = users.find((u) => u.email === ADMIN_EMAIL);

  let authUserId = existingAuthUser?.id;

  if (!existingAuthUser) {
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: password,
        email_confirm: true,
        user_metadata: { role: "SUPER_ADMIN" },
      });

    if (authError) {
      console.error("❌ Supabase Auth Error:", authError.message);
      process.exit(1);
    }
    authUserId = authUser.user.id;
  } else {
    // If auth user exists, we reset their password to the new generated one
    await supabase.auth.admin.updateUserById(existingAuthUser.id, {
      password: password,
    });
    console.log("🔄 Updated existing Auth user password.");
  }

  // 4. Create User in Prisma
  console.log("💾 Seeding Database Record...");
  await prisma.user.create({
    data: {
      id: authUserId!, // Link strict ID
      sapId: "SUPER-ADMIN",
      fullName: "System Administrator",
      role: "SUPER_ADMIN",
      isActive: true,
      isPaid: true,
      profileCompleted: true,
      // No password hash stored here, Supabase handles it.
    },
  });

  // 5. Output Credentials
  console.log("\n" + "=".repeat(50));
  console.log("✅  SUPER ADMIN CREATED SUCCESSFULLY");
  console.log("=".repeat(50));
  console.log(`📧 Email:    ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${password}`);
  console.log("=".repeat(50));
  console.log("⚠️  COPY THIS PASSWORD NOW. IT WILL NOT BE SHOWN AGAIN.");
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
