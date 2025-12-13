"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StudentStats } from "@/actions/students-actions";
import { Users, CheckCircle2, XCircle, UserCheck } from "lucide-react";

interface StudentStatsViewProps {
  stats: StudentStats;
}

export function StudentStatsView({ stats }: StudentStatsViewProps) {
  const paidPercentage =
    stats.totalStudents > 0
      ? (stats.paidStudents / stats.totalStudents) * 100
      : 0;

  const profilePercentage =
    stats.totalStudents > 0
      ? (stats.profileCompleted / stats.totalStudents) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Students</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidStudents}</div>
            <Progress value={paidPercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {paidPercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profiles Completed
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileCompleted}</div>
            <Progress value={profilePercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {profilePercentage.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Semester Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Students per Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.bySemester.map((item) => (
                <div key={item.semester} className="flex items-center">
                  <div className="w-16 font-medium">Sem {item.semester}</div>
                  <div className="flex-1 mx-4">
                    <Progress
                      value={(item.count / stats.totalStudents) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-muted-foreground">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Students per Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {stats.bySection.map((item) => (
                <div
                  key={item.section}
                  className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg border border-border"
                >
                  <div className="text-2xl font-bold text-primary">
                    {item.section}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.count} Students
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
