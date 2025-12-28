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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Semester Distribution - Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Students by Semester
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution across semesters
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
                        const colors = [
                          "#8b5cf6", // violet
                          "#3b82f6", // blue
                          "#06b6d4", // cyan
                          "#10b981", // emerald
                          "#f59e0b", // amber
                          "#f97316", // orange
                          "#f43f5e", // rose
                          "#ec4899", // pink
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

              {/* Legend */}
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
                        Sem {item.semester}
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

        {/* Section Distribution - Donut Chart */}
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
            <div className="flex items-center justify-center gap-8">
              {/* Donut Chart */}
              <div className="relative w-48 h-48">
                {stats.bySection.length > 0 ? (
                  <>
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50" fill="#f8fafc" />
                      {(() => {
                        const total = stats.bySection.reduce(
                          (sum, s) => sum + s.count,
                          0
                        );
                        let currentAngle = 0;
                        const colors = [
                          "#4f39f6", // primary
                          "#10b981", // emerald
                          "#f59e0b", // amber
                          "#3b82f6", // blue
                          "#f43f5e", // rose
                          "#8b5cf6", // violet
                        ];

                        return stats.bySection.map((item, index) => {
                          const percentage = (item.count / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;

                          const x1 =
                            50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                          const y1 =
                            50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                          const x2 =
                            50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
                          const y2 =
                            50 + 50 * Math.sin((currentAngle * Math.PI) / 180);

                          const x3 =
                            50 + 25 * Math.cos((currentAngle * Math.PI) / 180);
                          const y3 =
                            50 + 25 * Math.sin((currentAngle * Math.PI) / 180);
                          const x4 =
                            50 + 25 * Math.cos((startAngle * Math.PI) / 180);
                          const y4 =
                            50 + 25 * Math.sin((startAngle * Math.PI) / 180);

                          const largeArc = angle > 180 ? 1 : 0;

                          return (
                            <path
                              key={item.section}
                              d={`M ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A 25 25 0 ${largeArc} 0 ${x4} ${y4} Z`}
                              fill={colors[index % colors.length]}
                              className="transition-all hover:opacity-80 cursor-pointer"
                            />
                          );
                        });
                      })()}
                      <circle cx="50" cy="50" r="25" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {stats.bySection.length}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Sections
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

              {/* Legend */}
              <div className="space-y-2">
                {stats.bySection.map((item, index) => {
                  const colors = [
                    "#4f39f6",
                    "#10b981",
                    "#f59e0b",
                    "#3b82f6",
                    "#f43f5e",
                    "#8b5cf6",
                  ];
                  const percentage =
                    stats.totalStudents > 0
                      ? Math.round((item.count / stats.totalStudents) * 100)
                      : 0;

                  return (
                    <div key={item.section} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <span className="text-sm font-medium">
                        Section {item.section}
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
      </div>
    </div>
  );
}
