"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

interface TrafficDataPoint {
  hour: string;
  entries: number;
}

interface TrafficChartProps {
  data: TrafficDataPoint[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Entries Per Hour
          </h3>
          <p className="text-sm text-slate-500">Real-time gate traffic flow</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <Activity className="h-5 w-5 text-[#4F39F6]" />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F39F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F39F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: "#0F172A", fontWeight: 600 }}
              itemStyle={{ color: "#4F39F6" }}
            />
            <Area
              type="monotone"
              dataKey="entries"
              stroke="#4F39F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEntries)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
