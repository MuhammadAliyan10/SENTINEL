"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentDirectoryRow } from "@/actions/students-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StudentsDirectoryProps {
  data: StudentDirectoryRow[];
  pageCount: number;
  currentPage: number;
  currentFilter: string;
}

export function StudentsDirectory({
  data,
  pageCount,
  currentPage,
  currentFilter,
}: StudentsDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", value);
    params.set("page", "1"); // Reset to page 1
    router.push(`?${params.toString()}`);
  };

  const handleRowClick = (studentId: string) => {
    router.push(`/admin/students/${studentId}`);
  };

  const columns: ColumnDef<StudentDirectoryRow>[] = [
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
        return isPaid ? (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Paid
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Unpaid
          </Badge>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Student Directory</h2>
        <Select value={currentFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="paid">Paid Only</SelectItem>
            <SelectItem value="unpaid">Unpaid Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  data-state={row.getIsSelected() && "selected"}
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
    </div>
  );
}
