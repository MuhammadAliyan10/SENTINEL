"use client";

import { Shield, Users, Trophy, Radio } from "lucide-react";
import { type GuardStats } from "@/actions/guard-actions";

interface GuardStatsViewProps {
  stats: GuardStats;
}

export function GuardStatsView({ stats }: GuardStatsViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Active Guards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Guards</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {stats.active}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Scanned in last 10 mins
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl relative">
            <Radio className="h-8 w-8 text-emerald-600" />
            <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Total Force */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Force</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </div>
          <div className="p-4 bg-[#4F39F6]/10 rounded-xl">
            <Shield className="h-8 w-8 text-[#4F39F6]" />
          </div>
        </div>
      </div>

      {/* Top Performer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Top Performer</p>
            <p className="text-xl font-bold text-slate-900 mt-2 truncate max-w-[180px]">
              {stats.topPerformer || "No data yet"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.totalScans} total scans today
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <Trophy className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
