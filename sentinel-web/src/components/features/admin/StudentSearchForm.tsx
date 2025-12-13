"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";

interface StudentSearchFormProps {
  initialQuery: string;
}

export function StudentSearchForm({ initialQuery }: StudentSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsSearching(true);

    // Update URL with search param
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", trimmedQuery);
    router.push(`/admin/students?${params.toString()}`);

    // Reset loading state after navigation
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleClear = () => {
    setQuery("");
    router.push("/admin/students");
  };

  return (
    <Card className="bg-white border-border shadow-sm">
      <CardContent className="p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter SAP ID (e.g., 70168915)"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              className="pl-12 h-14 text-xl font-mono tracking-wider bg-slate-50 border-border focus:bg-white"
              autoFocus
            />
            {query && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {query.length}/8
              </span>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-14 px-8"
            disabled={isSearching || query.length !== 8}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Search
              </>
            )}
          </Button>
          {initialQuery && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-14"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
