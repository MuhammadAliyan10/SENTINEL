"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminHeader() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      setIsSearching(true);
      router.push(`/admin/students?q=${encodeURIComponent(trimmedQuery)}`);

      // Reset after navigation
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    },
    [query, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            type="search"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Search SAP ID..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            onKeyDown={handleKeyDown}
            className="pl-10 bg-slate-50 border-border focus:bg-white font-mono"
            disabled={isSearching}
          />
        </div>
      </form>

      {/* Right Side - Notifications */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
            3
          </span>
        </Button>
      </div>
    </div>
  );
}
