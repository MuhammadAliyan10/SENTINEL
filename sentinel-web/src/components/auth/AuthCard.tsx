import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  description,
  icon,
  children,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={cn(
        "w-full bg-white/95 backdrop-blur-sm shadow-2xl border-slate-200",
        className
      )}
    >
      <CardHeader className="text-center space-y-2 pb-4">
        {icon && (
          <div className="mx-auto mb-2 flex items-center justify-center">
            {icon}
          </div>
        )}
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
