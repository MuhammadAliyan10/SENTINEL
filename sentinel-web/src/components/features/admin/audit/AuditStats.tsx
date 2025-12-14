"use client";

import { Activity, ShieldAlert, Users } from "lucide-react";

interface AuditStatsProps {
  totalActions24h: number;
  highRiskActions: number;
  uniqueAdmins: number;
}

export function AuditStats({
  totalActions24h,
  highRiskActions,
  uniqueAdmins,
}: AuditStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Actions (24h) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Actions (24h)</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {totalActions24h}
            </p>
            <p className="text-xs text-slate-400 mt-1">Admin activity volume</p>
          </div>
          <div className="p-4 bg-[#4F39F6]/10 rounded-xl">
            <Activity className="h-8 w-8 text-[#4F39F6]" />
          </div>
        </div>
      </div>

      {/* High Risk Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">High Risk</p>
            <p className="text-4xl font-bold text-red-600 mt-2">
              {highRiskActions}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              DELETE, BAN, REVOKE actions
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Unique Admins */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Staff</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {uniqueAdmins}
            </p>
            <p className="text-xs text-slate-400 mt-1">Unique admins today</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <Users className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
