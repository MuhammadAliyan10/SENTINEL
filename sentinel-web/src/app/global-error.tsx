"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Global Error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Critical System Error</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            The application encountered a critical error and cannot recover.
          </p>
          <Button onClick={() => reset()} variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Application
          </Button>
        </div>
      </body>
    </html>
  );
}
