import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client for use in Server Components and Server Actions
 * This client automatically handles cookie-based authentication
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Gets the current authenticated user from Supabase Auth
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Authorization check for authenticated users
 * Throws an error if user is not authenticated
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return { userId: user.id };
}

// =============================================================================
// DEPRECATED FUNCTIONS - DO NOT USE
// =============================================================================
// The following functions are kept for backwards compatibility but should NOT
// be used in new code. Use @/lib/auth functions with Prisma instead.
//
// - getUserProfile() - Use prisma.user.findUnique() instead
// - getUserProfileSafe() - Use prisma.user.findUnique() with select instead
// - isAdmin() - Use requireSuperAdmin() from @/lib/auth instead
// - getUserRole() - Use prisma.user.findUnique({ select: { role: true }}) instead
// - requireAdmin() - Use requireSuperAdmin() from @/lib/auth instead
// =============================================================================
