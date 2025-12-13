import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client (Service Role)
 * CRITICAL: This client bypasses Row Level Security (RLS).
 * Use ONLY in Server Actions/API routes for admin operations.
 * NEVER expose the service role key to the client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables for admin client. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Singleton Admin Client for server-side usage
 */
export const supabaseAdmin = createAdminClient();
