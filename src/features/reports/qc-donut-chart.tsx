"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

interface QcDonutChartProps {
  passed: number;
  pendingRework: number;
  rejected: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">
        {item.name}: {item.value.toLocaleString()} pcs
      </p>
    </div>
  );
}

export function QcDonutChart({ passed, pendingRework, rejected }: QcDonutChartProps) {
  const total = passed + pendingRework + rejected;
  const data = [
    { name: "Passed", value: passed, color: "var(--color-success)" },
    { name: "Rework Pending", value: pendingRework, color: "var(--color-warning)" },
    { name: "Rejected", value: rejected, color: "var(--color-critical)" },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No inspections recorded yet.</div>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-56 w-full items-center justify-center sm:w-56">
        <PieChart width={208} height={208}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={94} paddingAngle={2} strokeWidth={0}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}</span>
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {entry.value.toLocaleString()} ({formatShare(entry.value, total)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatShare(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}
