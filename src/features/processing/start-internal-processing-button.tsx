"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { processingOrderActionHooks } from "@/features/processing/service";
import type { ProcessingOrder } from "@/types";

export function StartInternalProcessingButton({ processingOrder, size }: { processingOrder: ProcessingOrder; size?: "sm" | "default" }) {
  const startMutation = processingOrderActionHooks.useStartInternal();

  if (processingOrder.mode !== "internal" || processingOrder.status !== "planned") return null;

  async function handleStart() {
    try {
      await startMutation.mutateAsync(processingOrder);
      toast.success(`${processingOrder.processingOrderNumber} — processing started`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Button size={size} onClick={handleStart} disabled={startMutation.isPending}>
      {startMutation.isPending ? "Starting…" : "Start Processing"}
    </Button>
  );
}
