import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  wrapperClassName?: string;
}

export function AuthLayout({ children, wrapperClassName }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/Login.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content Wrapper */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md p-4 animate-in fade-in zoom-in-95 duration-500",
          wrapperClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
