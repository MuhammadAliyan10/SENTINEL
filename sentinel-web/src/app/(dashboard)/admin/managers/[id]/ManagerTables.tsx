"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ============================================
// STUDENTS TABLE WITH SEARCH & PAGINATION
// ============================================

interface Student {
  id: string;
  sapId: string;
  fullName: string | null;
  createdAt: Date;
}

interface StudentsTableProps {
  students: Student[];
}

const PAGE_SIZE = 10;

export function StudentsTableClient({ students }: StudentsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const term = search.toLowerCase();
    return students.filter(
      (s) =>
        s.sapId.toLowerCase().includes(term) ||
        s.fullName?.toLowerCase().includes(term)
    );
  }, [students, search]);

  const pageCount = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = filteredStudents.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No students registered yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Registered Students</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SAP ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SAP ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono">{student.sapId}</TableCell>
                  <TableCell>{student.fullName || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(student.createdAt).toLocaleDateString("en-PK", {
                      timeZone: "Asia/Karachi",
                      dateStyle: "medium",
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(student.createdAt).toLocaleTimeString("en-PK", {
                      timeZone: "Asia/Karachi",
                      timeStyle: "short",
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-6"
                >
                  No students match "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}-
              {Math.min((page + 1) * PAGE_SIZE, filteredStudents.length)} of{" "}
              {filteredStudents.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pageCount - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// AUDIT LOGS TABLE WITH SEARCH & PAGINATION
// ============================================

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  timestamp: Date;
}

interface AuditLogsTableProps {
  logs: AuditLog[];
}

export function AuditLogsTableClient({ logs }: AuditLogsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const term = search.toLowerCase();
    return logs.filter(
      (log) =>
        log.action.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term)
    );
  }, [logs, search]);

  const pageCount = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No audit logs found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Activity Logs</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action or details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.details || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-6"
                >
                  No logs match "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}-
              {Math.min((page + 1) * PAGE_SIZE, filteredLogs.length)} of{" "}
              {filteredLogs.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pageCount - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
