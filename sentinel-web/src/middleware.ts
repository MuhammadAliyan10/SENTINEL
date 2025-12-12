import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ============================================
  // AUTHENTICATED USER REDIRECTS (LOGIN PAGE)
  // ============================================
  if (user && pathname === "/login") {
    // Fetch role to determine redirect destination
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      if (profile.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (profile.role === "student") {
        return NextResponse.redirect(new URL("/student", request.url));
      } else if (profile.role === "guard") {
        // Guards might have a specific dashboard or share admin/student view
        // For now, redirect to unauthorized or a guard page if it existed
        // Assuming guards use admin view for now or have no specific home yet
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  // ============================================
  // ADMIN ROUTES PROTECTION
  // ============================================
  if (pathname.startsWith("/admin")) {
    // Not logged in -> redirect to login
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      // If student trying to access admin -> redirect to student home
      if (profile?.role === "student") {
        return NextResponse.redirect(new URL("/student", request.url));
      }
      // Otherwise -> redirect to unauthorized
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // ============================================
  // STUDENT ROUTES PROTECTION
  // ============================================
  if (pathname.startsWith("/student")) {
    // Not logged in -> redirect to login
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the user has a profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, payment_status")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // No profile -> redirect to login (something is wrong)
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If admin trying to access student view -> redirect to admin dashboard
    if (profile.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (icons, manifest, etc.)
     * - api routes that handle their own auth
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|offline|api).*)",
  ],
};
