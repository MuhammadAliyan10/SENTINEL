"use client";

import { useState, useTransition } from "react";
import {
  revokeStudentAccess,
  restoreStudentAccess,
  manualPaymentOverride,
} from "@/actions/students-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldOff,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  CreditCard,
  Building,
  CalendarDays,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  sapId: string;
  fullName: string | null;
  role: string;
  gender: string | null;
  isPaid: boolean;
  profileCompleted: boolean;
  isActive: boolean;
  section: string | null;
  department: string | null;
  semester: string | null;
  phoneNumber: string | null;
  cnic: string | null;
  profilePhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    fullName: string | null;
    role: string;
    sapId: string;
  } | null;
  accessLogs: {
    id: string;
    timestamp: Date;
    status: string;
    gateNumber: string | null;
    scanner: {
      fullName: string | null;
      role: string;
    } | null;
  }[];
}

interface StudentProfileProps {
  student: Student;
}

export function StudentProfile({ student }: StudentProfileProps) {
  const [isPending, startTransition] = useTransition();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const getInitials = (name: string | null): string => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRevoke = () => {
    startTransition(async () => {
      const result = await revokeStudentAccess(student.id, revokeReason);
      if (result.success) {
        toast.success(result.message);
        setRevokeDialogOpen(false);
        setRevokeReason("");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      const result = await restoreStudentAccess(student.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleMarkPaid = () => {
    startTransition(async () => {
      const result = await manualPaymentOverride(student.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GRANTED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Granted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "DUPLICATE":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
            <Clock className="h-3 w-3" />
            Duplicate
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={student.profilePhotoUrl || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitials(student.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {student.fullName || "Unknown Student"}
                </CardTitle>
                <p className="text-3xl font-mono font-bold text-primary tracking-widest mt-1">
                  {student.sapId}
                </p>
                <div className="flex gap-2 mt-2">
                  {student.isActive ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      Revoked
                    </Badge>
                  )}
                  {student.isPaid ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Paid
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      Unpaid
                    </Badge>
                  )}
                  {student.profileCompleted && (
                    <Badge variant="outline">Profile Complete</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Action Buttons */}
            <div className="flex gap-2">
              {/* Manual Payment Button */}
              {!student.isPaid && (
                <Button
                  variant="outline"
                  className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handleMarkPaid}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Mark Paid
                </Button>
              )}

              {/* Revoke/Restore Access */}
              {student.isActive ? (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setRevokeDialogOpen(true)}
                  disabled={isPending}
                >
                  <ShieldOff className="h-4 w-4" />
                  Revoke Access
                </Button>
              ) : (
                <Button
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleRestore}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Restore Access
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium">{student.department || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Section</p>
                <p className="font-medium">{student.section || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Semester</p>
                <p className="font-medium">{student.semester || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium font-mono">
                  {student.phoneNumber || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">CNIC</p>
                <p className="font-medium font-mono">{student.cnic || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Registered By</p>
                <p className="font-medium">
                  {student.createdBy
                    ? `${
                        student.createdBy.fullName || student.createdBy.sapId
                      } (${student.createdBy.role})`
                    : "System"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <CardTitle>Entry History</CardTitle>
          <CardDescription>
            Last {student.accessLogs.length} access attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {student.accessLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No entry logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.accessLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.gateNumber || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.scanner
                        ? `${log.scanner.fullName || "Unknown"} (${
                            log.scanner.role
                          })`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Revoke Access
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately prevent{" "}
              <strong>{student.fullName || student.sapId}</strong> from entering
              the venue. This action is logged and can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Reason for revocation</Label>
            <Input
              id="reason"
              placeholder="e.g., Misconduct, Payment refund, etc."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isPending || revokeReason.trim().length < 5}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Revoking..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
