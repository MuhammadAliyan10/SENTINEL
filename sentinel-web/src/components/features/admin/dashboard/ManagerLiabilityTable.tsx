"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagerLiabilityItem } from "@/actions/dashboard-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

interface ManagerLiabilityTableProps {
  data: ManagerLiabilityItem[];
}

export function ManagerLiabilityTable({ data }: ManagerLiabilityTableProps) {
  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Manager Liability</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manager</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Liability</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((manager) => {
              const semesterDisplay = manager.semester
                ? (() => {
                    const sem = Number(manager.semester);
                    const suffix =
                      sem === 1
                        ? "st"
                        : sem === 2
                        ? "nd"
                        : sem === 3
                        ? "rd"
                        : "th";
                    return `${sem}${suffix}`;
                  })()
                : null;
              const classDisplay =
                semesterDisplay && manager.section
                  ? `${semesterDisplay} ${manager.section}`
                  : semesterDisplay || manager.section || "—";
              return (
                <TableRow key={manager.id}>
                  <TableCell className="font-medium">{manager.name}</TableCell>
                  <TableCell className="font-mono">{classDisplay}</TableCell>
                  <TableCell className="text-right">
                    {manager.studentsOnboarded}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    Rs. {manager.cashLiability.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
