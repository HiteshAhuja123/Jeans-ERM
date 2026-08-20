"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sewingOrderActionHooks } from "@/features/sewing/service";
import type { SewingOrder } from "@/types";

const startableStatuses: SewingOrder["status"][] = ["assigned", "ready"];

function ReadinessRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <Check className="size-4 text-success" aria-hidden="true" /> : <X className="size-4 text-critical" aria-hidden="true" />}
      <span className={ok ? "text-foreground" : "text-critical"}>{label}</span>
    </div>
  );
}

export function StartSewingButton({ sewingOrder, size }: { sewingOrder: SewingOrder; size?: "sm" | "default" }) {
  const startMutation = sewingOrderActionHooks.useStart();
  const [open, setOpen] = useState(false);

  if (!startableStatuses.includes(sewingOrder.status)) return null;

  const lineReady = Boolean(sewingOrder.productionLineId);
  const bundlesReady = sewingOrder.quantity > 0;
  const canStart = lineReady && bundlesReady;

  async function handleStart() {
    try {
      await startMutation.mutateAsync(sewingOrder);
      toast.success(`${sewingOrder.sewingOrderNumber} — sewing started`);
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        Start Sewing
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Sewing — {sewingOrder.sewingOrderNumber}?</DialogTitle>
            <DialogDescription>Marks this sewing order In Progress and moves its assigned bundles into sewing.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <ReadinessRow ok={lineReady} label={lineReady ? "Line assigned" : "No line assigned yet"} />
            <ReadinessRow ok={bundlesReady} label={bundlesReady ? `${sewingOrder.quantity.toLocaleString()} pcs assigned` : "No bundles assigned yet"} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleStart} disabled={!canStart || startMutation.isPending}>
              {startMutation.isPending ? "Starting…" : "Start Sewing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
