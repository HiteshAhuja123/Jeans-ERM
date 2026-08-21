"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { qcOrderActionHooks } from "@/features/quality/service";
import type { QcOrder } from "@/types";

export function StartQcButton({ qcOrder, size }: { qcOrder: QcOrder; size?: "sm" | "default" }) {
  const startMutation = qcOrderActionHooks.useStart();

  if (qcOrder.status !== "planned") return null;

  async function handleStart() {
    try {
      await startMutation.mutateAsync(qcOrder);
      toast.success(`${qcOrder.qcOrderNumber} — inspection started`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Button size={size} onClick={handleStart} disabled={startMutation.isPending}>
      {startMutation.isPending ? "Starting…" : "Start Inspection"}
    </Button>
  );
}
