"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ArrowRight, User, GraduationCap } from "lucide-react";
import {
  searchStudents,
  StudentSearchResult,
} from "@/actions/students-actions";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function StudentSearchConsole() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

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

  // Debounce search - increased delay for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      // Require 4 characters minimum since first 3 digits are same for everyone
      if (query.trim().length >= 4) {
        performSearch(query);
      } else if (query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
      }
    }, 600); // Slightly longer debounce for better performance

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleViewProfile = (id: string) => {
    router.push(`/admin/students/${id}`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Search Hero Section */}
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Student Directory
          </h2>
          <p className="text-muted-foreground text-lg">
            Search for students by name or SAP ID (last 4-5 digits)
          </p>
        </div>

        <div className="relative w-full max-w-2xl shadow-lg rounded-xl transition-shadow hover:shadow-xl">
          <div className="absolute inset-y-0 left-4 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            className="h-14 pl-12 pr-32 text-lg bg-white border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl"
            placeholder="Search by Name or Last 5 Digits of SAP ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={50}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
            {query.length > 0 && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded",
                  query.length >= 4
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-amber-600 bg-amber-50"
                )}
              >
                {query.length}/50
              </span>
            )}
            {isPending && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>
        </div>

        {!hasSearched && query.length < 4 && (
          <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
            {query.length === 0
              ? "💡 Tip: Type at least 4 characters to start searching (e.g., last 5 digits of SAP ID)"
              : `Type ${4 - query.length} more character${
                  4 - query.length === 1 ? "" : "s"
                } to search`}
          </p>
        )}
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-xl font-semibold text-foreground">
              Search Results
            </h3>
            <Badge variant="secondary" className="px-3 py-1">
              {results.length} found
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((student) => (
              <Card
                key={student.id}
                className="group cursor-pointer border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md overflow-hidden"
                onClick={() => handleViewProfile(student.id)}
              >
                <CardContent className="p-0">
                  <div className="p-5 flex items-start space-x-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      <AvatarImage src={student.profilePhotoUrl || undefined} />
                      <AvatarFallback
                        className={cn(
                          "text-lg font-medium",
                          student.isPaid
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {student.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {student.fullName}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono bg-slate-50 inline-block px-1.5 rounded">
                        {student.sapId}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 h-5 gap-1"
                        >
                          <GraduationCap className="h-3 w-3" />
                          {student.semester ? `Sem ${student.semester}` : "N/A"}
                        </Badge>
                        {student.isPaid ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 h-5 hover:bg-emerald-100">
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0.5 h-5 hover:bg-amber-100">
                            Unpaid
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground group-hover:bg-primary/5 transition-colors">
                    <span>View Profile</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-6 w-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">No students found</p>
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t find any student matching &quot;{query}&quot;
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setQuery("")}
                className="mt-2"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
