"use client";

import { cn } from "@/lib/utils";
import {
  Users,
  Activity,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Radio,
  Shield,
  Clock,
} from "lucide-react";

// Map of icon names to components
const iconMap = {
  Users,
  Activity,
  AlertTriangle,
  DollarSign,
  Radio,
  Shield,
  Clock,
} as const;

type IconName = keyof typeof iconMap;

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: IconName;
  trend?: "up" | "down";
  trendValue?: string;
  progress?: {
    current: number;
    max: number;
  };
  valueColor?: string;
}

export function StatCard({
  title,
  value,
  iconName,
  trend,
  trendValue,
  progress,
  valueColor,
}: StatCardProps) {
  const Icon = iconMap[iconName];
  const progressPercentage = progress
    ? Math.min((progress.current / progress.max) * 100, 100)
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="h-5 w-5 text-[#4F39F6]" />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <p className={cn("text-3xl font-bold text-slate-900", valueColor)}>
            {value}
          </p>

          {/* Trend Indicator */}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" ? "text-emerald-500" : "text-red-500"
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>

        {/* Progress indicator for capacity */}
        {progress && (
          <span className="text-sm text-slate-400">/ {progress.max}</span>
        )}
      </div>

      {/* Progress Bar */}
      {progressPercentage !== null && (
        <div className="mt-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F39F6] rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {progressPercentage.toFixed(0)}% capacity
          </p>
        </div>
      )}
    </div>
  );
}
