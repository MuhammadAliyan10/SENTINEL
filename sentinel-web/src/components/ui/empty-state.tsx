import { LucideIcon, SearchX, Ghost, FileX, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * EmptyState Component
 * Renders a styled empty state with icon, text, and optional action.
 * Used when data tables or lists have no items.
 */
export function EmptyState({
  icon: Icon = SearchX,
  title = "No records found",
  description = "Try adjusting your search or filters to find what you're looking for.",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description}
      </p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured variants for common use cases
export function NoResultsState({
  onClearFilters,
}: {
  onClearFilters?: () => void;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description="We couldn't find any matches for your search."
      action={
        onClearFilters
          ? { label: "Clear filters", onClick: onClearFilters }
          : undefined
      }
    />
  );
}

export function NoDataState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Ghost}
      title="No data yet"
      description="Get started by creating your first record."
      action={onCreate ? { label: "Create new", onClick: onCreate } : undefined}
    />
  );
}

export function NoUsersState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="There are no users matching the current criteria."
      action={onCreate ? { label: "Add user", onClick: onCreate } : undefined}
    />
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={FileX}
      title="Something went wrong"
      description="We couldn't load the data. Please try again."
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
    />
  );
}
