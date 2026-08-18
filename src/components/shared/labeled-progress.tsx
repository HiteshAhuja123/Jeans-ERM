import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/types";

interface LabeledProgressProps {
  label: string;
  current: number;
  total: number;
  /** Text shown at the right, defaults to "current / total". */
  valueLabel?: string;
  level?: StatusLevel;
  className?: string;
  /** Bar + percentage only, no label row or trailing caption. Use inside table cells. */
  compact?: boolean;
}

const barClasses: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-critical",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

export function LabeledProgress({
  label,
  current,
  total,
  valueLabel,
  level = "info",
  className,
  compact = false,
}: LabeledProgressProps) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const bar = (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${percent}% complete`}
    >
      <div
        className={cn("h-full rounded-full transition-all", barClasses[level])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex-1">{bar}</div>
        <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
          {percent}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {valueLabel ?? `${current.toLocaleString()} / ${total.toLocaleString()}`}
        </span>
      </div>
      {bar}
      <span className="text-xs text-muted-foreground tabular-nums">{percent}% complete</span>
    </div>
  );
}
