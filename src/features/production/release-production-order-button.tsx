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
import { getProductionReadiness, type MaterialAvailability } from "@/lib/production-utils";
import { materialReservationHooks } from "@/features/production/service";
import type { MaterialRequirementLine } from "@/lib/production-utils";
import type { ProductionOrder } from "@/types";

interface ReleaseProductionOrderButtonProps {
  productionOrder: ProductionOrder;
  materialAvailability: MaterialAvailability;
  materialLines: MaterialRequirementLine[];
  capacityOk: boolean;
}

function ReadinessRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <Check className="size-4 text-success" aria-hidden="true" /> : <X className="size-4 text-critical" aria-hidden="true" />}
      <span className={ok ? "text-foreground" : "text-critical"}>{label}</span>
    </div>
  );
}

export function ReleaseProductionOrderButton({
  productionOrder,
  materialAvailability,
  materialLines,
  capacityOk,
}: ReleaseProductionOrderButtonProps) {
  const releaseMutation = materialReservationHooks.useReleaseProductionOrder();
  const [open, setOpen] = useState(false);

  const readiness = getProductionReadiness(productionOrder, materialAvailability, capacityOk);

  async function handleRelease() {
    try {
      await releaseMutation.mutateAsync({
        productionOrder,
        materials: materialLines.map((line) => ({ materialId: line.materialId, quantity: line.required })),
      });
      toast.success(`${productionOrder.productionOrderNumber} released for production`);
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <Button variant={readiness.overall === "ready" ? "default" : "outline"} onClick={() => setOpen(true)}>
        Release Production Order
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release {productionOrder.productionOrderNumber}?</DialogTitle>
            <DialogDescription>
              Releasing reserves the required materials and marks this order as approved and ready for execution. It
              does not start production.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <ReadinessRow ok={readiness.materialReady} label={readiness.materialReady ? "Material ready" : "Material shortage"} />
            <ReadinessRow ok={readiness.lineAssigned} label={readiness.lineAssigned ? "Production line assigned" : "No production line assigned"} />
            <ReadinessRow ok={readiness.scheduleSet} label={readiness.scheduleSet ? "Schedule planned" : "Planned dates missing"} />
            <ReadinessRow ok={readiness.capacityOk} label={readiness.capacityOk ? "Capacity available" : "Line is over capacity"} />
          </div>
          {readiness.overall === "not_ready" && (
            <p className="rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-xs text-warning">
              This order isn&apos;t fully ready. You can still release it, but review the items above first.
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRelease} disabled={releaseMutation.isPending}>
              {releaseMutation.isPending ? "Releasing…" : readiness.overall === "ready" ? "Release" : "Release Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
