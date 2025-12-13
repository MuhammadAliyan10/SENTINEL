"use client";

import { useEffect, useState, useRef } from "react";
import { HmacSHA256 } from "crypto-js";
import { WifiOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DigitalPassProps {
  user: {
    id: string;
    sapId: string;
    fullName: string | null;
    profilePhotoUrl: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    section: string | null;
    activationToken: string | null;
  };
}

export default function DigitalPass({ user }: DigitalPassProps) {
  const [qrPayload, setQrPayload] = useState<string>("");
  const [isOffline, setIsOffline] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<any>(null);

  useEffect(() => {
    // Initial state
    updateQr();
    setIsOffline(!navigator.onLine);

    // Intervals
    const qrInterval = setInterval(updateQr, 15000); // Refresh signature every 15 seconds

    function updateQr() {
      if (!user.activationToken) return;

      const timestamp = Date.now();
      const payloadString = `${user.sapId}:${timestamp}`;

      // HMAC-SHA256 signature using crypto-js
      const signature = HmacSHA256(
        payloadString,
        user.activationToken
      ).toString();

      // Final payload as JSON
      const payload = JSON.stringify({
        sap: user.sapId,
        ts: timestamp,
        sig: signature,
      });

      setQrPayload(payload);
    }

    // Network listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(qrInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user.id, user.sapId, user.activationToken]);

  // Generate stylized QR code using qr-code-styling
  useEffect(() => {
    if (!qrPayload || !qrRef.current) return;

    const initQR = async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;

      // Clear previous QR
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
      }

      // Create new stylized QR
      qrCodeInstance.current = new QRCodeStyling({
        width: 360,
        height: 360,
        type: "svg",
        data: qrPayload,
        dotsOptions: {
          color: "#1a1a1a",
          type: "rounded",
        },
        cornersSquareOptions: {
          color: "#1a1a1a",
          type: "extra-rounded", // Rounded corner squares
        },
        cornersDotOptions: {
          color: "#1a1a1a",
          type: "dot", // Circular corner dots
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 8,
          imageSize: 0.4,
        },

        qrOptions: {
          errorCorrectionLevel: "H",
        },
      });

      if (qrRef.current) {
        qrCodeInstance.current.append(qrRef.current);
      }
    };

    initQR();
  }, [qrPayload]);

  // Online/Offline border colors
  const borderColor = isOffline ? "border-yellow-400" : "border-none";

  if (!qrPayload) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4 overflow-hidden">
      {/* Pass Card - Airline Boarding Pass Style */}
      <div className="w-full max-w-sm py-4 bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with Logo Centered */}
        <div className="bg-white p-4 border-b border-gray-400 flex flex-col items-center">
          <Image
            src="/UniversityLogo.jpeg"
            alt="University"
            width={300}
            height={200}
            className="object-contain mb-2"
          />
          <span className="text-md font-semibold text-slate-900 tracking-wide">
            CS Annual Dinner 2025
          </span>
        </div>

        {/* QR Code Section */}
        <div
          className={cn(
            "p-6 bg-white relative border-4 transition-colors duration-300",
            borderColor
          )}
        >
          {/* Stylized QR Code Container */}
          <div className="flex justify-center">
            <div
              ref={qrRef}
              className="flex items-center justify-center"
              style={{ minHeight: 380, minWidth: 380 }}
            />
          </div>

          {/* Offline Overlay */}
          {isOffline && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center">
              <WifiOff className="h-10 w-10 text-yellow-500 mb-2" />
              <p className="font-semibold text-yellow-700">OFFLINE MODE</p>
              <p className="text-xs text-slate-500">Using cached ticket</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
