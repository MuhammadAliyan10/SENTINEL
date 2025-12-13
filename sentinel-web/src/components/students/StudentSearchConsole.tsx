"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { searchStudents, StudentSearchResult } from "@/actions/students";
import { useRouter, useSearchParams } from "next/navigation";

export function StudentSearchConsole() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 3) {
        performSearch(query);
      } else if (query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = (term: string) => {
    startTransition(async () => {
      const response = await searchStudents(term);
      if (response.success) {
        setResults(response.students);
      } else {
        setResults([]);
      }
      setHasSearched(true);
    });
  };

  const handleViewProfile = (id: string) => {
    router.push(`/admin/students/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-10 text-lg"
            placeholder="Search by Name or SAP ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {!hasSearched && (
          <p className="text-sm text-muted-foreground">
            Enter at least 3 characters to search
          </p>
        )}
      </div>

      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Found {results.length} result{results.length !== 1 && "s"}
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((student) => (
              <Card
                key={student.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleViewProfile(student.id)}
              >
                <CardContent className="p-4 flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={""} /> {/* Add photo URL if available */}
                    <AvatarFallback>
                      {student.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {student.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {student.sapId}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0"
                      >
                        {student.semester ? `Sem ${student.semester}` : "N/A"}
                      </Badge>
                      {student.isPaid ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1 py-0 hover:bg-green-100">
                          Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1 py-0 hover:bg-red-100">
                          Unpaid
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No students found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
