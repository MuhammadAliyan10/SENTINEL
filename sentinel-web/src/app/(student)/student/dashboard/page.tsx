"use client";

import { useEffect, useState } from "react";
import { getTicketData } from "@/actions/student-actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import DigitalPass from "@/components/features/student/DigitalPass";

interface TicketData {
  user: {
    id: string;
    sapId: string;
    fullName: string | null;
    profilePhotoUrl: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    section: string | null;
    // SECURITY: activationToken is no longer in client response
  };
  qrCode: string;
  timestamp: number;
}

export default function StudentDashboard() {
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await getTicketData();
      if (res) {
        // Extract only the fields we need, properly typed
        const ticketData: TicketData = {
          user: {
            id: res.user.id,
            sapId: res.user.sapId,
            fullName: res.user.fullName,
            profilePhotoUrl: res.user.profilePhotoUrl,
            gender: res.user.gender,
            section: res.user.section,
          },
          qrCode: res.qrCode,
          timestamp: res.timestamp,
        };
        setData(ticketData);
        localStorage.setItem("cachedTicket", JSON.stringify(ticketData));
      }
    } catch (error) {
      // SECURITY: Don't log full error details in production
      const cached = localStorage.getItem("cachedTicket");
      if (cached) {
        try {
          setData(JSON.parse(cached) as TicketData);
          toast.warning("Offline Mode: Using cached ticket");
        } catch {
          toast.error("Failed to load cached ticket.");
        }
      } else {
        toast.error("Network error and no cached ticket found.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  // Transform data to match DigitalPass props
  const initialQrData = {
    payload: data.qrCode,
    expiresAt: data.timestamp + 5 * 60 * 1000, // 5 minutes
  };

  return <DigitalPass user={data.user} initialQrData={initialQrData} />;
}
