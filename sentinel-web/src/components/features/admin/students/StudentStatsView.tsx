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

      {/* Distribution Charts Row */}
      {/*
        OLD: Two charts side-by-side (Semester + Section)
        NEW: Single semester chart (Section chart removed as requested)

        The "Students by Section" chart has been removed to focus on semester-based
        strength overview, which is more relevant for batch analysis and planning.
      */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Semester Distribution - Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Students per Semester
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Batch strength distribution across all semesters
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="relative w-48 h-48">
                {stats.bySemester.length > 0 ? (
                  <>
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {(() => {
                        const total = stats.bySemester.reduce(
                          (sum, s) => sum + s.count,
                          0
                        );
                        let currentAngle = 0;
                        // UPDATED: Enhanced color palette for better distinction
                        const colors = [
                          "#8b5cf6", // violet (1st sem)
                          "#3b82f6", // blue (2nd sem)
                          "#06b6d4", // cyan (3rd sem)
                          "#10b981", // emerald (4th sem)
                          "#f59e0b", // amber (5th sem)
                          "#f97316", // orange (6th sem)
                          "#f43f5e", // rose (7th sem)
                          "#ec4899", // pink (8th sem)
                        ];

                        return stats.bySemester.map((item, index) => {
                          const percentage = (item.count / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const x1 =
                            50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
                          const y1 =
                            50 + 50 * Math.sin((currentAngle * Math.PI) / 180);
                          currentAngle += angle;
                          const x2 =
                            50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
                          const y2 =
                            50 + 50 * Math.sin((currentAngle * Math.PI) / 180);
                          const largeArc = angle > 180 ? 1 : 0;

                          return (
                            <path
                              key={item.semester}
                              d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[index % colors.length]}
                              className="transition-all hover:opacity-80 cursor-pointer"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-2xl font-bold">
                          {stats.totalStudents}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Total
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data
                  </div>
                )}
              </div>

              {/* Legend with Count & Percentage */}
              <div className="space-y-2">
                {stats.bySemester.map((item, index) => {
                  const colors = [
                    "#8b5cf6",
                    "#3b82f6",
                    "#06b6d4",
                    "#10b981",
                    "#f59e0b",
                    "#f97316",
                    "#f43f5e",
                    "#ec4899",
                  ];
                  const percentage =
                    stats.totalStudents > 0
                      ? Math.round((item.count / stats.totalStudents) * 100)
                      : 0;

                  return (
                    <div
                      key={item.semester}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <span className="text-sm font-medium">
                        Semester {item.semester}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/*
          ================================================================
          OLD: "Students by Section" Donut Chart (REMOVED)
          ================================================================

          The section-based chart has been removed per user request to focus
          on semester-based batch strength analysis. The semester chart above
          provides better insights for:
          - Overall batch strength at a glance
          - Enrollment trends across academic years
          - Resource allocation planning per semester

          If section-level analysis is needed, it can be found in the
          Students Directory tab with search/filter capabilities.

          Original implementation preserved below for reference:
        */}
        {/*
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Students by Section
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution across sections
            </p>
          </CardHeader>
          <CardContent>
            ... [section chart code removed for brevity] ...
          </CardContent>
        </Card>
        */}
      </div>
    </div>
  );
}
