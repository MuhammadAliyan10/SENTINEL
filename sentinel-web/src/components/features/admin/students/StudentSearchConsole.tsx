"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, User, ExternalLink } from "lucide-react";
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 4) {
        performSearch(query);
      } else if (query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleViewProfile = (id: string) => {
    router.push(`/admin/students/${id}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Search Header */}
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Student Directory
          </h2>
          <p className="text-muted-foreground">
            Search by name or SAP ID (last 4-5 digits)
          </p>
        </div>

        <div className="relative w-full max-w-xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            className="h-12 pl-12 pr-20 text-base bg-white border-slate-200 focus:border-primary rounded-lg shadow-sm"
            placeholder="Search by Name or Last 5 Digits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={50}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            {query.length > 0 && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded",
                  query.length >= 4
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-amber-600 bg-amber-50"
                )}
              >
                {query.length}/50
              </span>
            )}
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        </div>

        {!hasSearched && query.length < 4 && query.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Type {4 - query.length} more character
            {4 - query.length === 1 ? "" : "s"} to search
          </p>
        )}
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Search Results
            </h3>
            <Badge variant="secondary" className="px-3">
              {results.length} found
            </Badge>
          </div>

          {results.length > 0 ? (
            <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[280px]">Student</TableHead>
                    <TableHead className="w-[130px]">SAP ID</TableHead>
                    <TableHead className="w-[80px] text-center">
                      Semester
                    </TableHead>
                    <TableHead className="w-[80px] text-center">
                      Section
                    </TableHead>
                    <TableHead className="w-[80px] text-center">
                      Status
                    </TableHead>
                    <TableHead className="w-[80px] text-center">
                      Payment
                    </TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleViewProfile(student.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage
                              src={student.profilePhotoUrl || undefined}
                            />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {student.fullName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {student.fullName || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                          {student.sapId}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {student.semester || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">
                          {student.section || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {student.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs hover:bg-emerald-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Revoked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.isPaid ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs hover:bg-blue-100">
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs hover:bg-amber-100">
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">No students found</p>
                <p className="text-sm text-muted-foreground">
                  No student matches &quot;{query}&quot;
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
