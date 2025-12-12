import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, Profile, ProfileSafe } from "@/types/database";

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
 * Gets the current authenticated user
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
 * Gets the current user's profile
 * Returns null if not authenticated or profile not found
 */
export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

/**
 * Gets the current user's safe profile (without totp_secret)
 */
export async function getUserProfileSafe(): Promise<ProfileSafe | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Query profiles_safe view (excludes totp_secret)
  const { data: profile } = await supabase
    .from("profiles_safe")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as ProfileSafe | null;
}

/**
 * Checks if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "admin";
}

/**
 * Gets the current user's role
 * Returns null if not authenticated or profile not found
 */
export async function getUserRole(): Promise<
  "admin" | "student" | "guard" | null
> {
  const profile = await getUserProfile();
  return profile?.role || null;
}

/**
 * Authorization check for server actions
 * Throws an error if user is not authenticated or not admin
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return { userId: user.id };
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
