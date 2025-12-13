"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

// ============================================
// TYPES
// ============================================

interface SemesterData {
  semester: string;
  count: number;
}

interface DepartmentData {
  department: string;
  count: number;
  paid: number;
}

interface EntryData {
  hour: string;
  entries: number;
  exits: number;
}

interface PaymentStatusData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ============================================
// COLOR PALETTE
// ============================================

const COLORS = [
  "#4F39F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

// ============================================
// STUDENTS BY SEMESTER (BAR CHART)
// ============================================

interface StudentsBySemesterChartProps {
  data: SemesterData[];
}

export function StudentsBySemesterChart({
  data,
}: StudentsBySemesterChartProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Students by Semester
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="semester"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="count"
              fill="#4F39F6"
              radius={[4, 4, 0, 0]}
              name="Students"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================
// DEPARTMENT DISTRIBUTION (HORIZONTAL BAR)
// ============================================

interface DepartmentDistributionChartProps {
  data: DepartmentData[];
}

export function DepartmentDistributionChart({
  data,
}: DepartmentDistributionChartProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Students by Department
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              horizontal={false}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="department"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="count"
              fill="#4F39F6"
              radius={[0, 4, 4, 0]}
              name="Total"
            />
            <Bar
              dataKey="paid"
              fill="#10B981"
              radius={[0, 4, 4, 0]}
              name="Paid"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================
// PAYMENT STATUS (PIE CHART)
// ============================================

interface PaymentStatusChartProps {
  paid: number;
  unpaid: number;
}

export function PaymentStatusChart({ paid, unpaid }: PaymentStatusChartProps) {
  const data: PaymentStatusData[] = [
    { name: "Paid", value: paid },
    { name: "Unpaid", value: unpaid },
  ];

  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              <Cell fill="#10B981" />
              <Cell fill="#EF4444" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">Paid ({paid})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">
              Unpaid ({unpaid})
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// ENTRY VELOCITY (AREA CHART)
// ============================================

interface EntryVelocityChartProps {
  data: EntryData[];
  showExits?: boolean;
}

export function EntryVelocityChart({
  data,
  showExits = false,
}: EntryVelocityChartProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {showExits ? "Entry & Exit Velocity" : "Entry Velocity Today"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={showExits ? 300 : 200}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F39F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F39F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            {showExits && <Legend />}
            <Area
              type="monotone"
              dataKey="entries"
              stroke="#4F39F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEntries)"
              name="Entries"
            />
            {showExits && (
              <Area
                type="monotone"
                dataKey="exits"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExits)"
                name="Exits"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================
// MANAGER PERFORMANCE (BAR CHART)
// ============================================

interface ManagerData {
  name: string;
  registrations: number;
  revenue: number;
}

interface ManagerPerformanceChartProps {
  data: ManagerData[];
}

export function ManagerPerformanceChart({
  data,
}: ManagerPerformanceChartProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Top Managers by Registrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="registrations"
              fill="#4F39F6"
              radius={[4, 4, 0, 0]}
              name="Registrations"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
