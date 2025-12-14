"use client";

import { useState, useTransition } from "react";
import {
  revokeStudentAccess,
  restoreStudentAccess,
  manualPaymentOverride,
  manualCheckIn,
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
  UserCheck,
  MoreVertical,
  History,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const router = useRouter();
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

  const handleManualCheckIn = () => {
    startTransition(async () => {
      const result = await manualCheckIn(student.id);
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
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3" />
            Granted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 hover:bg-red-100">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "DUPLICATE":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 hover:bg-blue-100">
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
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20 border-4 border-slate-50 shadow-sm">
            <AvatarImage src={student.profilePhotoUrl || undefined} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
              {getInitials(student.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              {student.fullName || "Unknown Student"}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm font-medium text-slate-700">
                {student.sapId}
              </span>
              <span>•</span>
              <span className="text-sm font-medium text-foreground">
                {student.department || "CS"}
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              {student.isActive ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">Revoked</Badge>
              )}
              {student.isPaid ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                  Paid
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-200 bg-amber-50"
                >
                  Unpaid
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex gap-2">
          {student.isActive && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleManualCheckIn}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4 text-emerald-600" />
              )}
              Check-In
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {!student.isPaid && (
                <DropdownMenuItem onClick={handleMarkPaid} disabled={isPending}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {student.isActive ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setRevokeDialogOpen(true)}
                  disabled={isPending}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Revoke Access
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-600"
                  onClick={handleRestore}
                  disabled={isPending}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Restore Access
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Department
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {student.department || "CS"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Section
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {student.section || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Semester
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {student.semester || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    CNIC
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {student.cnic || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {student.phoneNumber || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats/History */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {student.accessLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No activity recorded</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {student.accessLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {log.gateNumber || "Main Gate"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="scale-90 origin-right">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  ))}
                  {student.accessLogs.length > 5 && (
                    <div className="p-2 text-center border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground h-8"
                      >
                        View All History
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
