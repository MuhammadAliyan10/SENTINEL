"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface LogFilterBarProps {
  onFilterChange: (filters: {
    search: string;
    actionType: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
}

const ACTION_TYPES = [
  { value: "ALL", label: "All Actions" },
  { value: "LOGIN", label: "Login" },
  { value: "CREATE_USER", label: "Create User" },
  { value: "UPDATE_USER", label: "Update User" },
  { value: "DELETE_USER", label: "Delete User" },
  { value: "REVOKE_ACCESS", label: "Revoke Access" },
  { value: "MANUAL_OVERRIDE", label: "Manual Override" },
  { value: "UPDATE_SETTINGS", label: "Update Settings" },
];

export function LogFilterBar({ onFilterChange }: LogFilterBarProps) {
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, actionType, dateFrom, dateTo });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, actionType, dateFrom, dateTo, onFilterChange]);

  const clearFilters = () => {
    setSearch("");
    setActionType("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = search || actionType !== "ALL" || dateFrom || dateTo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sticky top-0 z-10">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by ID or performer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>

        {/* Action Type */}
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger className="w-full md:w-[180px] border-slate-200">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full md:w-[150px] border-slate-200"
          placeholder="From"
        />

        {/* Date To */}
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full md:w-[150px] border-slate-200"
          placeholder="To"
        />

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
