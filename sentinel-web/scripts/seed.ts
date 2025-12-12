import { createClient } from "@supabase/supabase-js";
import { authenticator } from "otplib";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  );
  process.exit(1);
}

console.log(`Using Supabase URL: ${SUPABASE_URL}`);
console.log(`Has Service Role Key: ${!!SERVICE_ROLE_KEY}`);
console.log(`Has Database URL: ${!!DATABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log("🌱 Starting database seed...");

  // Try a simple health check query
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) {
      console.error("Health check failed:", error.message);
      if (error.message.includes("schema cache")) {
        console.error(
          "TIP: The table might not exist or the schema cache is stale."
        );
        console.error("If you have a DATABASE_URL, we can try direct SQL.");
      }
    } else {
      console.log("Database connection verified.");
    }
  } catch (err) {
    console.error("Health check error:", err);
  }

  const users = [
    {
      email: "admin@sentinel.edu",
      password: "admin123",
      role: "admin",
      full_name: "Super Admin",
      sap_id: "ADMIN001",
      payment_status: true,
    },
    {
      email: "student.a@university.edu",
      password: "password123",
      role: "student",
      full_name: "Alice Perfect",
      sap_id: "SAP1001",
      payment_status: true,
    },
    {
      email: "student.b@university.edu",
      password: "password123",
      role: "student",
      full_name: "Bob Unpaid",
      sap_id: "SAP1002",
      payment_status: false,
    },
    {
      email: "student.c@university.edu",
      password: "password123",
      role: "student",
      full_name: "Charlie Existing",
      sap_id: "SAP1003",
      payment_status: true,
      create_log: true,
    },
  ];

  for (const user of users) {
    console.log(`Processing user: ${user.email}`);

    // 1. Create or Update User in Auth
    // Note: admin.createUser will fail if user exists, so we try/catch or check first
    // But listUsers is paginated. A simpler way is to try create, if fail, try update (if needed)
    // or just list users by email to check existence.

    let userId: string | null = null;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(
      (u) => u.email === user.email
    );

    if (existingUser) {
      console.log(`  - User already exists in Auth. Updating password...`);
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: user.password, email_confirm: true }
      );
      if (error) {
        console.error(`  - Error updating user: ${error.message}`);
        continue;
      }
      userId = existingUser.id;
    } else {
      console.log(`  - Creating new user in Auth...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });
      if (error) {
        console.error(`  - Error creating user: ${error.message}`);
        continue;
      }
      userId = data.user.id;
    }

    if (!userId) continue;

    // 2. Create or Update Profile
    // Generate a TOTP secret
    const totpSecret = authenticator.generateSecret();

    console.log(`  - Upserting profile...`);
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: user.full_name,
      sap_id: user.sap_id,
      role: user.role,
      payment_status: user.payment_status,
      totp_secret: totpSecret,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error(`  - Error upserting profile: ${profileError.message}`);
    } else {
      console.log(`  - Profile upserted successfully.`);
    }

    // 3. Create Entry Log for Student C
    if (user.create_log) {
      console.log(`  - Creating entry log...`);
      const { error: logError } = await supabase.from("entry_logs").insert({
        student_id: userId,
        scan_type: "entry",
        timestamp: new Date().toISOString(),
        status: "valid",
      });
      if (logError) {
        console.error(`  - Error creating entry log: ${logError.message}`);
      } else {
        console.log(`  - Entry log created.`);
      }
    }
  }

  console.log("✅ Seeding complete!");
}

seed().catch((err) => {
  console.error("Unexpected error during seeding:", err);
  process.exit(1);
});
