"use client";

import { useState, useTransition, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  StudentDirectoryRow,
  getAllStudentsForExport,
  bulkRevokeStudents,
  bulkRestoreStudents,
  bulkMarkAsPaid,
} from "@/actions/students-actions";
import { exportToCSV } from "@/lib/export";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Ban,
  CheckCircle,
  CreditCard,
  Loader2,
} from "lucide-react";

interface StudentsDirectoryProps {
  data: StudentDirectoryRow[];
  pageCount: number;
  currentPage: number;
  currentManagerSearch: string;
}

export function StudentsDirectory({
  data,
  pageCount,
  currentPage,
  currentManagerSearch,
}: StudentsDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Manager search state
  const [managerInput, setManagerInput] = useState(currentManagerSearch);
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // Confirmation dialogs
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Debounced manager search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (managerInput !== currentManagerSearch) {
        const params = new URLSearchParams(searchParams);
        if (managerInput.trim()) {
          params.set("manager", managerInput.trim());
        } else {
          params.delete("manager");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [managerInput]);

  const handleRowClick = (studentId: string) => {
    router.push(`/admin/students/${studentId}`);
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllOnPage = () => {
    const allOnPage = new Set(data.map((s) => s.id));
    const allSelected = data.every((s) => selectedIds.has(s.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(allOnPage);
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Export handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await getAllStudentsForExport();
      if (result.success) {
        exportToCSV(
          result.data,
          `students_export_${new Date().toISOString().split("T")[0]}`,
          [
            { key: "sapId", header: "SAP ID" },
            { key: "fullName", header: "Full Name" },
            { key: "gender", header: "Gender" },
            { key: "section", header: "Section" },
            { key: "semester", header: "Semester" },
            { key: "isPaid", header: "Payment Status" },
            { key: "isActive", header: "Account Status" },
            { key: "profileCompleted", header: "Profile Completed" },
            { key: "createdAt", header: "Registration Date" },
            { key: "managerName", header: "Registered By" },
          ]
        );
        toast.success("Export downloaded successfully");
      } else {
        toast.error(result.message || "Export failed");
      }
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk action handlers
  const handleBulkRevoke = () => {
    startTransition(async () => {
      const result = await bulkRevokeStudents(
        Array.from(selectedIds),
        "Bulk revocation by admin"
      );
      if (result.success) {
        toast.success(result.message);
        clearSelection();
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setShowRevokeDialog(false);
    });
  };

  const handleBulkRestore = () => {
    startTransition(async () => {
      const result = await bulkRestoreStudents(Array.from(selectedIds));
      if (result.success) {
        toast.success(result.message);
        clearSelection();
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setShowRestoreDialog(false);
    });
  };

  const handleBulkMarkPaid = () => {
    startTransition(async () => {
      const result = await bulkMarkAsPaid(Array.from(selectedIds));
      if (result.success) {
        toast.success(result.message);
        clearSelection();
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setShowMarkPaidDialog(false);
    });
  };

  const columns: ColumnDef<StudentDirectoryRow>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={data.length > 0 && data.every((s) => selectedIds.has(s.id))}
          onCheckedChange={toggleAllOnPage}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelection(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "fullName",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={student.profilePhotoUrl || ""} />
              <AvatarFallback>
                {student.fullName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{student.fullName || "Unknown"}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {student.sapId}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "class",
      header: "Class",
      cell: ({ row }) => {
        const { semester, section } = row.original;
        if (!semester && !section)
          return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="secondary" className="font-mono text-xs">
            {semester || "?"}
            {section || "?"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isPaid",
      header: "Status",
      cell: ({ row }) => {
        const isPaid = row.getValue("isPaid") as boolean;
        const isActive = row.original.isActive;
        return (
          <div className="flex flex-col gap-1">
            {isPaid ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Paid
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                Unpaid
              </Badge>
            )}
            {!isActive && (
              <Badge variant="outline" className="text-red-600 border-red-300">
                Revoked
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "managerName",
      header: "Manager",
      cell: ({ row }) => {
        const manager = row.getValue("managerName") as string;
        return <span className="text-sm text-muted-foreground">{manager}</span>;
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      {/* Header with Export and Manager Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Student Directory</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Input
            placeholder="Search by manager name..."
            value={managerInput}
            onChange={(e) => setManagerInput(e.target.value)}
            className="w-[200px]"
          />
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {hasSelection && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevokeDialog(true)}
            disabled={isPending}
          >
            <Ban className="h-4 w-4 mr-1" />
            Revoke
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRestoreDialog(true)}
            disabled={isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Restore
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMarkPaidDialog(true)}
            disabled={isPending}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Mark Paid
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={selectedIds.has(row.original.id) && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {currentPage} of {pageCount}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        title="Revoke Access"
        description={`Are you sure you want to revoke access for ${selectedIds.size} student(s)? They will not be able to enter the venue.`}
        confirmText="Revoke Access"
        variant="destructive"
        onConfirm={handleBulkRevoke}
        loading={isPending}
      />

      <ConfirmDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        title="Restore Access"
        description={`Are you sure you want to restore access for ${selectedIds.size} student(s)?`}
        confirmText="Restore Access"
        onConfirm={handleBulkRestore}
        loading={isPending}
      />

      <ConfirmDialog
        open={showMarkPaidDialog}
        onOpenChange={setShowMarkPaidDialog}
        title="Mark as Paid"
        description={`Are you sure you want to mark ${selectedIds.size} student(s) as paid? This is a payment override.`}
        confirmText="Mark as Paid"
        onConfirm={handleBulkMarkPaid}
        loading={isPending}
      />
    </div>
  );
}
