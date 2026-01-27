"use client";

import { Lock, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "verified"
  | "pending"
  | "overdue"
  | "paid"
  | "disputed"
  | "active"
  | "inactive";

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; icon: typeof Lock; className: string }
> = {
  verified: {
    label: "Verified",
    icon: Lock,
    className: "bg-success/10 text-success border-success/20",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  disputed: {
    label: "Disputed",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  inactive: {
    label: "Inactive",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({
  status,
  showIcon = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      )}
      {config.label}
    </span>
  );
}
