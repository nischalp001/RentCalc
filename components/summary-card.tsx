"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const variantStyles = {
  default: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  success: {
    icon: "bg-success/10 text-success",
    value: "text-success",
  },
  warning: {
    icon: "bg-warning/10 text-warning-foreground",
    value: "text-warning-foreground",
  },
  destructive: {
    icon: "bg-destructive/10 text-destructive",
    value: "text-destructive",
  },
};

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold tracking-tight lg:text-3xl", styles.value)}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-success" : "text-destructive"
                )}
              >
                {trend.positive ? "+" : ""}
                {trend.value} from last month
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg lg:h-12 lg:w-12",
              styles.icon
            )}
          >
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
