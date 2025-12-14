"use client";

import { MapPin, Clock, DoorOpen, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventDetailsProps {
  venue?: string;
  gate?: string;
  time?: string;
  mapsUrl?: string;
}

export function EventDetails({
  venue = "Royal Palm Golf & Country Club",
  gate = "Gate 4 - Student Entry",
  time = "7:00 PM - 11:00 PM",
  mapsUrl = "https://maps.google.com/?q=Royal+Palm+Golf+Country+Club+Lahore",
}: EventDetailsProps) {
  const handleGetDirections = () => {
    window.open(mapsUrl, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">
        Event Details
      </h3>

      <div className="space-y-4">
        {/* Venue */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#4F39F6]/10 rounded-lg">
            <MapPin className="h-4 w-4 text-[#4F39F6]" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Venue</p>
            <p className="text-sm font-medium text-slate-900">{venue}</p>
          </div>
        </div>

        {/* Gate */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#4F39F6]/10 rounded-lg">
            <DoorOpen className="h-4 w-4 text-[#4F39F6]" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Entry</p>
            <p className="text-sm font-medium text-slate-900">{gate}</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#4F39F6]/10 rounded-lg">
            <Clock className="h-4 w-4 text-[#4F39F6]" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Time</p>
            <p className="text-sm font-medium text-slate-900">{time}</p>
          </div>
        </div>
      </div>

      {/* Get Directions Button */}
      <Button
        onClick={handleGetDirections}
        variant="outline"
        className="w-full mt-5 border-[#4F39F6] text-[#4F39F6] hover:bg-[#4F39F6]/5"
      >
        <Navigation className="h-4 w-4 mr-2" />
        Get Directions
      </Button>
    </div>
  );
}
