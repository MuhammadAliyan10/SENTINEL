"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentStats } from "@/actions/students-actions";
import { Users, CheckCircle2, UserCheck } from "lucide-react";

interface StudentStatsViewProps {
  stats: StudentStats;
}

export function StudentStatsView({ stats }: StudentStatsViewProps) {
  const paidPercentage =
    stats.totalStudents > 0
      ? Math.round((stats.paidStudents / stats.totalStudents) * 100)
      : 0;

  const profilePercentage =
    stats.totalStudents > 0
      ? Math.round((stats.profileCompleted / stats.totalStudents) * 100)
      : 0;

  // Find max for semester chart scaling
  const maxSemesterCount = Math.max(...stats.bySemester.map((s) => s.count), 1);

  // Calculate pie chart values (using CSS conic-gradient)
  const paidDegrees = (paidPercentage / 100) * 360;

  return (
    <div className="space-y-8">
      {/* Key Metrics Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Students */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Users className="h-7 w-7 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Students
                </p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid Students with Pie */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Mini Donut Chart */}
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#10b981 ${paidDegrees}deg, #e5e7eb ${paidDegrees}deg)`,
                }}
              >
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Paid Students
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.paidStudents}
                </p>
                <p className="text-xs text-muted-foreground">
                  {paidPercentage}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles Completed with Pie */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Mini Donut Chart */}
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#3b82f6 ${
                    (profilePercentage / 100) * 360
                  }deg, #e5e7eb ${(profilePercentage / 100) * 360}deg)`,
                }}
              >
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Profiles Complete
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.profileCompleted}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profilePercentage}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semester Distribution - Vertical Bar Graph */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            Students by Semester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-56 pt-6 pb-2 border-b border-slate-200">
            {stats.bySemester.map((item, index) => {
              const heightPercent = (item.count / maxSemesterCount) * 100;
              // Different colors for each bar
              const colors = [
                "bg-violet-500",
                "bg-blue-500",
                "bg-cyan-500",
                "bg-emerald-500",
                "bg-amber-500",
                "bg-orange-500",
                "bg-rose-500",
                "bg-pink-500",
              ];
              const barColor = colors[index % colors.length];
              return (
                <div
                  key={item.semester}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-sm font-bold text-foreground">
                    {item.count}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-10 ${barColor} transition-all duration-500`}
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 pt-3">
            {stats.bySemester.map((item) => (
              <div key={item.semester} className="flex-1 text-center">
                <span className="text-xs font-medium text-muted-foreground">
                  Sem {item.semester}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
