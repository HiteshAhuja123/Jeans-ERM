"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getLineCapacitySnapshot } from "@/lib/production-utils";
import { productionOrderHooks } from "@/features/production/service";
import { productionLineHooks } from "@/features/production-lines/service";

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CapacityView() {
  const router = useRouter();
  const { data: lines = [] } = productionLineHooks.useList();
  const { data: productionOrders = [] } = productionOrderHooks.useList();
  const [date, setDate] = useState(() => toIso(new Date()));

  const activeLines = useMemo(() => lines.filter((l) => l.status === "active"), [lines]);

  const snapshots = useMemo(
    () => activeLines.map((line) => getLineCapacitySnapshot(line, date, productionOrders)),
    [activeLines, date, productionOrders],
  );

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(toIso(d));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Capacity Overview" description="Daily capacity vs. planned load per production line" />

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon-sm" aria-label="Previous day" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">{formatDate(date)}</span>
        <Button variant="outline" size="icon-sm" aria-label="Next day" onClick={() => shiftDate(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {snapshots.map((snapshot) => {
          const overCapacity = snapshot.utilizationPercent > 100;
          return (
            <Card key={snapshot.lineId} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{snapshot.lineName}</span>
                {overCapacity && <AlertTriangle className="size-4 text-critical" aria-hidden="true" />}
              </div>
              <LabeledProgress
                label="Planned load"
                current={snapshot.planned}
                total={snapshot.dailyCapacity}
                valueLabel={`${snapshot.planned.toLocaleString()} / ${snapshot.dailyCapacity.toLocaleString()} pcs`}
                level={overCapacity ? "critical" : snapshot.utilizationPercent >= 90 ? "warning" : "success"}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available: {snapshot.available.toLocaleString()} pcs</span>
                <span>{snapshot.utilizationPercent}% utilized</span>
              </div>
              {overCapacity && <p className="text-xs text-critical">⚠ This line is over capacity on this date.</p>}
            </Card>
          );
        })}
      </div>

      <Button variant="outline" className="w-fit" onClick={() => router.push("/production/schedule")}>
        View Full Schedule
      </Button>
    </div>
  );
}
