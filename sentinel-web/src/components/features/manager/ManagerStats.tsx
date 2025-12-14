"use client";

import { Users, Banknote } from "lucide-react";

interface ManagerStatsProps {
  totalStudents: number;
  ticketPrice: number;
}

export function ManagerStats({
  totalStudents,
  ticketPrice,
}: ManagerStatsProps) {
  const cashInHand = totalStudents * ticketPrice;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* My Registrations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              My Registrations
            </p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {totalStudents}
            </p>
            <p className="text-xs text-slate-400 mt-1">Students registered</p>
          </div>
          <div className="p-4 bg-[#4F39F6]/10 rounded-xl">
            <Users className="h-8 w-8 text-[#4F39F6]" />
          </div>
        </div>
      </div>

      {/* Cash Collected */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Cash Collected</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {formatCurrency(cashInHand)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              @ {formatCurrency(ticketPrice)} per ticket
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <Banknote className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
