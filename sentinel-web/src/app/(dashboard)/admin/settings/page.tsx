import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { getAllEvents } from "@/actions/settings-actions";
import { TicketPricingCard } from "@/components/features/admin/settings/TicketPricingCard";
import { EventsManager } from "@/components/features/admin/settings/EventsManager";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireSuperAdmin();
  const events = await getAllEvents();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          System Settings
        </h2>
        <p className="text-slate-500">
          Manage global configuration for the Sentinel system.
        </p>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <EventsManager initialEvents={events} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
          <TicketPricingCard />
        </Suspense>
      </div>
    </div>
  );
}
