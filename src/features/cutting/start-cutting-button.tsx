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
import { canStartCutting } from "@/lib/cutting-utils";
import { cuttingOrderActionHooks, fabricIssueHooks } from "@/features/cutting/service";
import type { CuttingOrder } from "@/types";

const startableStatuses: CuttingOrder["status"][] = ["pending", "material_check", "ready"];

function ReadinessRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <Check className="size-4 text-success" aria-hidden="true" /> : <X className="size-4 text-critical" aria-hidden="true" />}
      <span className={ok ? "text-foreground" : "text-critical"}>{label}</span>
    </div>
  );
}

export function StartCuttingButton({ cuttingOrder, size }: { cuttingOrder: CuttingOrder; size?: "sm" | "default" }) {
  const { data: issues = [] } = fabricIssueHooks.useByCuttingOrder(cuttingOrder.id);
  const startMutation = cuttingOrderActionHooks.useStartCutting();
  const [open, setOpen] = useState(false);

  if (!startableStatuses.includes(cuttingOrder.status)) return null;

  const fabricIssued = issues.reduce((sum, i) => sum + i.quantity, 0);
  const materialReady = canStartCutting(cuttingOrder.fabricRequired, fabricIssued);

  async function handleStart() {
    try {
      await startMutation.mutateAsync(cuttingOrder);
      toast.success(`${cuttingOrder.cuttingOrderNumber} — cutting started`);
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        Start Cutting
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Cutting — {cuttingOrder.cuttingOrderNumber}?</DialogTitle>
            <DialogDescription>
              Marks this cutting order In Progress. Fabric must be fully issued to the cutting floor before cutting can
              start.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <ReadinessRow ok={materialReady} label={materialReady ? "Fabric fully issued" : `Fabric shortage — ${fabricIssued.toLocaleString()} of ${cuttingOrder.fabricRequired.toLocaleString()} ${cuttingOrder.unit} issued`} />
          </div>
          {!materialReady && (
            <p className="rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-xs text-critical">
              Issue the remaining fabric before starting cutting on this order.
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleStart} disabled={!materialReady || startMutation.isPending}>
              {startMutation.isPending ? "Starting…" : "Start Cutting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
