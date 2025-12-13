import { requireSuperAdminPage } from "@/actions/auth-actions";
import { LiveDashboardClient } from "./LiveDashboardClient";

/**
 * Live Dashboard Page - Server Component Wrapper
 *
 * This page enforces SUPER_ADMIN authentication before
 * rendering the client-side real-time dashboard.
 */
export default async function LiveDashboardPage() {
  // Defense-in-depth: Explicit auth check
  await requireSuperAdminPage();

  return <LiveDashboardClient />;
}
