/**
 * SENTINEL KEEP-ALIVE CRON ENDPOINT
 *
 * Purpose: Prevent Vercel Serverless Functions from going cold.
 * Cold starts can cause 3-6 second delays on first request.
 *
 * This endpoint is called every 10 minutes by Vercel Cron to keep
 * the serverless function warm, eliminating cold start latency.
 *
 * Configured in: /vercel.json
 */

// Force dynamic rendering - ensures the function actually runs
// instead of being cached as a static response
export const dynamic = "force-dynamic";

// Disable caching entirely
export const revalidate = 0;

export async function GET() {
  const response = {
    status: "Alive",
    timestamp: new Date().toISOString(),
    service: "SENTINEL",
    uptime: process.uptime(),
  };

  return Response.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
