/**
 * SENTINEL QR Code Generator API (Edge Runtime)
 *
 * This endpoint runs on the Edge for ZERO cold start latency.
 * Generates cryptographically signed QR payloads for student digital passes.
 *
 * SECURITY:
 * - activationToken is NEVER sent to client
 * - Uses HMAC-SHA256 signature with Web Crypto API
 * - Payload expires in 5 minutes
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Enable Edge Runtime for zero cold starts (~50ms globally vs 500ms+ Node.js)
export const runtime = "edge";

// Disable caching - each QR must be fresh
export const dynamic = "force-dynamic";

/**
 * GET /api/qr/generate
 * Generates a fresh signed QR payload for the authenticated student
 */
export async function GET() {
  try {
    const cookieStore = await cookies();

    // 1. Create Supabase client for Edge
    const supabase = createServerClient(
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
              // Ignored in Edge context
            }
          },
        },
      }
    );

    // 2. Authenticate the request
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 3. Fetch student data directly from Supabase (Edge-compatible)
    const { data: student, error } = await supabase
      .from("User")
      .select("sapId, activationToken, isActive, isPaid, role")
      .eq("id", user.id)
      .single();

    if (error || !student) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (student.role !== "STUDENT") {
      return Response.json(
        { error: "Only students can generate passes" },
        { status: 403 }
      );
    }

    if (!student.isActive) {
      return Response.json(
        { error: "Your access has been revoked" },
        { status: 403 }
      );
    }

    if (!student.isPaid) {
      return Response.json(
        { error: "Payment required for access" },
        { status: 403 }
      );
    }

    if (!student.activationToken) {
      return Response.json(
        { error: "No activation token found" },
        { status: 400 }
      );
    }

    // 4. Generate timestamp and signature using Web Crypto API
    const timestamp = Date.now();
    const payloadString = `${student.sapId}:${timestamp}`;

    // HMAC-SHA256 using Web Crypto API (Edge-compatible)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(student.activationToken);
    const msgData = encoder.encode(payloadString);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      msgData
    );
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 5. Create QR payload (JSON format for scanner to parse)
    const qrPayload = JSON.stringify({
      sap: student.sapId,
      ts: timestamp,
      sig: signature,
    });

    // 6. Return the signed payload (token never leaves server)
    return Response.json(
      {
        payload: qrPayload,
        expiresAt: timestamp + 5 * 60 * 1000, // Valid for 5 minutes
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("QR Generation Error:", error);
    return Response.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qr/generate (Legacy support)
 * Redirects to GET handler for backwards compatibility
 */
export async function POST() {
  return GET();
}
