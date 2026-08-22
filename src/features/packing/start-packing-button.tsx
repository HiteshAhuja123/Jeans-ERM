"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { packingOrderActionHooks } from "@/features/packing/service";
import type { PackingOrder } from "@/types";

export function StartPackingButton({ packingOrder, size }: { packingOrder: PackingOrder; size?: "sm" | "default" }) {
  const startMutation = packingOrderActionHooks.useStart();

  if (packingOrder.status !== "planned") return null;

  async function handleStart() {
    try {
      await startMutation.mutateAsync(packingOrder);
      toast.success(`${packingOrder.packingOrderNumber} — packing started`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Button size={size} onClick={handleStart} disabled={startMutation.isPending}>
      {startMutation.isPending ? "Starting…" : "Start Packing"}
    </Button>
  );
}
