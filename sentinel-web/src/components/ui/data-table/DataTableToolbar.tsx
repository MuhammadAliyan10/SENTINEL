"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";

interface DataTableToolbarProps {
  searchPlaceholder?: string;
  searchParamName?: string;
  children?: React.ReactNode; // Action buttons slot
}

export function DataTableToolbar({
  searchPlaceholder = "Search...",
  searchParamName = "q",
  children,
}: DataTableToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get(searchParamName) || "";
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Debounced search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);

      // Debounce the URL update
      const timer = setTimeout(() => {
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString());

          if (value) {
            params.set(searchParamName, value);
          } else {
            params.delete(searchParamName);
          }

          // Reset to first page when searching
          params.set("page", "1");

          router.push(`?${params.toString()}`);
        });
      }, 300);

      return () => clearTimeout(timer);
    },
    [router, searchParams, searchParamName]
  );

  const clearSearch = () => {
    setSearchValue("");
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(searchParamName);
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={clearSearch}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Action Buttons Slot */}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
