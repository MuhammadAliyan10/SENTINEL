import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * SENTINEL MIDDLEWARE (Edge Runtime)
 *
 * IMPORTANT: This middleware runs at the Edge and is intentionally LIGHTWEIGHT.
 * It only checks for Supabase session existence.
 *
 * Heavy operations (Prisma queries, role verification) are done in:
 * - Layout.tsx (Server Component)
 * - Server Actions
 *
 * This prevents Edge Runtime crashes from Node.js-only APIs like Prisma.
 */
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

  // Refresh session (important for token rotation)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ============================================
  // ADMIN ROUTES - Session Check Only
  // Role verification happens in layout.tsx
  // ============================================
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Don't check role here - let layout.tsx handle it with Prisma
    return supabaseResponse;
  }

  // ============================================
  // STUDENT ROUTES - Session Check Only
  // ============================================
  if (pathname.startsWith("/student")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // ============================================
  // GUARD ROUTES - Session Check Only
  // ============================================
  if (pathname.startsWith("/guard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // ============================================
  // LOGIN PAGE - Redirect if already authenticated
  // ============================================
  if (user && pathname === "/login") {
    // Redirect to root for smart dispatching based on role
    return NextResponse.redirect(new URL("/", request.url));
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
