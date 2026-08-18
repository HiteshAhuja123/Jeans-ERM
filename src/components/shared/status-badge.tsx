import { AlertCircle, AlertTriangle, CheckCircle2, Circle, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { statusLevelClasses } from "@/lib/status";
import type { StatusLevel } from "@/types";

const levelIcons: Record<StatusLevel, typeof Info> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertCircle,
  info: Info,
  neutral: Circle,
};

interface StatusBadgeProps {
  label: string;
  level: StatusLevel;
  className?: string;
  /** Hide the icon for very dense layouts (table cells). Label + color still communicate status. */
  hideIcon?: boolean;
}

export function StatusBadge({ label, level, className, hideIcon }: StatusBadgeProps) {
  const Icon = levelIcons[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        statusLevelClasses[level],
        className,
      )}
    >
      {!hideIcon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {label}
    </span>
  );
}
