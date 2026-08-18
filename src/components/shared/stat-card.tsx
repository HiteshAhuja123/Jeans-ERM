import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatusLevel } from "@/types";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  href?: string;
  /** Small supporting line under the value, e.g. "83% of target". */
  helpText?: string;
  trend?: {
    direction: "up" | "down";
    value: string;
    /** Whether an "up" trend is good news for this metric (defaults to true). */
    isPositive?: boolean;
  };
  accent?: StatusLevel;
  className?: string;
}

const accentClasses: Record<StatusLevel, string> = {
  success: "text-success bg-success-subtle",
  warning: "text-warning bg-warning-subtle",
  critical: "text-critical bg-critical-subtle",
  info: "text-info bg-info-subtle",
  neutral: "text-muted-foreground bg-muted",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  helpText,
  trend,
  accent = "neutral",
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors",
        href && "hover:border-primary/40 hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", accentClasses[accent])}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</span>
      </div>
      {(helpText || trend) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                (trend.isPositive ?? true) === (trend.direction === "up")
                  ? "text-success"
                  : "text-critical",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {helpText && <span>{helpText}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
