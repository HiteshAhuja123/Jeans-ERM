"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatShortDate } from "@/lib/format";
import type { DailyProductionEntry } from "@/types";

interface ProductionTrendChartProps {
  data: DailyProductionEntry[];
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const completed = payload.find((p) => p.dataKey === "completed")?.value ?? 0;
  const target = payload.find((p) => p.dataKey === "target")?.value ?? 0;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{formatShortDate(label ?? "")}</p>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-chart-1" />
        <span className="text-muted-foreground">Completed</span>
        <span className="ml-auto font-medium tabular-nums text-popover-foreground">
          {completed.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border-2 border-muted-foreground bg-transparent" />
        <span className="text-muted-foreground">Target</span>
        <span className="ml-auto font-medium tabular-nums text-popover-foreground">
          {target.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function ProductionTrendChart({ data }: ProductionTrendChartProps) {
  return (
    <div className="flex h-72 flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-chart-1" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-3 border-t-2 border-dashed border-muted-foreground" />
          Target
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            interval={1}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
          <Bar dataKey="completed" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Line
            dataKey="target"
            stroke="var(--color-muted-foreground)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
