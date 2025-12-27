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

  // Add pathname header for layouts to read
  supabaseResponse.headers.set("x-pathname", request.nextUrl.pathname);

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
          // Re-add pathname header after response recreation
          supabaseResponse.headers.set("x-pathname", request.nextUrl.pathname);
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
  // RATE LIMITING (Login Endpoints)
  // ============================================
  if (
    (pathname.includes("/login") || pathname.includes("/api/guard/verify")) &&
    request.method === "POST"
  ) {
    // Only run if Upstash is configured
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      try {
        const { Ratelimit } = await import("@upstash/ratelimit");
        const { Redis } = await import("@upstash/redis");

        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        const ratelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10s
          analytics: true,
        });

        const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
        const { success } = await ratelimit.limit(`ratelimit:${ip}`);

        if (!success) {
          return new NextResponse(
            JSON.stringify({ error: "Too many requests" }),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch (error) {
        console.error("Rate limit error:", error);
        // Fail open (allow request) if rate limit fails
      }
    }
  }

  // ============================================
  // ADMIN ROUTES - Session Check Only
  // Role verification happens in layout.tsx
  // ============================================
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Don't check role here - let layout.tsx handle it with Prisma
    return supabaseResponse;
  }

  // ============================================
  // MANAGER ROUTES - Session Check Only
  // ============================================
  if (pathname.startsWith("/manager") && pathname !== "/manager/login") {
    if (!user) {
      const loginUrl = new URL("/manager/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
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
      const loginUrl = new URL("/login", request.url); // Guards might need their own login later
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // ============================================
  // LOGIN PAGE REDIRECTS
  // ============================================
  if (user) {
    if (
      pathname === "/login" ||
      pathname === "/admin/login" ||
      pathname === "/manager/login"
    ) {
      // If user is already logged in, redirect them to their respective dashboard
      // We can't easily know the role here without Prisma, so we send to home
      // and let the home page redirect based on role (if implemented) or just /
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ============================================
  // CSRF PROTECTION (API Routes)
  // ============================================
  if (
    pathname.startsWith("/api") &&
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const referer = request.headers.get("referer");

    // Allow requests from same origin
    if (origin && host && !origin.includes(host)) {
      return new NextResponse(JSON.stringify({ error: "Invalid Origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If no origin (some clients), check referer
    if (!origin && referer && host && !referer.includes(host)) {
      return new NextResponse(JSON.stringify({ error: "Invalid Referer" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, icons, manifest, etc.)
     *
     * This optimization prevents unnecessary middleware processing on static assets,
     * reducing latency by 50-100ms per asset request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
