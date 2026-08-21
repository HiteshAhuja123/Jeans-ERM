"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { finishingOrderActionHooks } from "@/features/finishing/service";
import type { FinishingOrder } from "@/types";

export function StartFinishingButton({ finishingOrder, size }: { finishingOrder: FinishingOrder; size?: "sm" | "default" }) {
  const startMutation = finishingOrderActionHooks.useStart();

  if (finishingOrder.status !== "planned") return null;

  async function handleStart() {
    try {
      await startMutation.mutateAsync(finishingOrder);
      toast.success(`${finishingOrder.finishingOrderNumber} — finishing started`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Button size={size} onClick={handleStart} disabled={startMutation.isPending}>
      {startMutation.isPending ? "Starting…" : "Start Finishing"}
    </Button>
  );
}
