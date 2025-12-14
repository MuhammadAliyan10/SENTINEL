import { Suspense } from "react";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { getActiveEvent, getSystemSettings } from "@/actions/settings-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { EventConfigForm } from "@/components/features/admin/settings/EventConfigForm";
import { TicketPricingCard } from "@/components/features/admin/settings/TicketPricingCard";
import { SystemControls } from "@/components/features/admin/settings/SystemControls";
import { DangerZone } from "@/components/features/admin/settings/DangerZone";

export const dynamic = "force-dynamic";

// ============================================
// SERVER COMPONENT
// ============================================

async function SettingsContent() {
  const [event, settings] = await Promise.all([
    getActiveEvent(),
    getSystemSettings(),
  ]);

  return (
    <div className="space-y-6">
      {/* Event Configuration */}
      {event && (
        <EventConfigForm
          event={{
            id: event.id,
            name: event.name,
            venue: event.venue,
            date: event.date,
            ticketPrice: event.ticketPrice,
            maxCapacity: event.maxCapacity,
          }}
        />
      )}

      {/* Ticket Pricing */}
      <TicketPricingCard />

      {/* System Controls */}
      <SystemControls settings={settings} />

      {/* Danger Zone */}
      <DangerZone />
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[300px] rounded-xl" />
      <Skeleton className="h-[250px] rounded-xl" />
      <Skeleton className="h-[120px] rounded-xl" />
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default async function SettingsPage() {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50 -m-6 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 mt-1">
          Configure global settings and event details
        </p>
      </div>

      {/* Content */}
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
