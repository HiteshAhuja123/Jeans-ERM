"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNextProductionOrderStatusOptions } from "@/lib/production-utils";
import { productionOrderStatusMeta } from "@/lib/status";
import { materialReservationHooks, productionOrderHooks } from "@/features/production/service";
import type { ProductionOrder, ProductionOrderStatus } from "@/types";

export function ProductionOrderStatusMenu({ productionOrder }: { productionOrder: ProductionOrder }) {
  const updateMutation = productionOrderHooks.useUpdate();
  const cancelMutation = materialReservationHooks.useCancelProductionOrder();
  const [open, setOpen] = useState(false);
  const options = getNextProductionOrderStatusOptions(productionOrder.status);

  if (options.length === 0) return null;

  async function handleChange(status: ProductionOrderStatus) {
    setOpen(false);
    try {
      if (status === "cancelled") {
        await cancelMutation.mutateAsync(productionOrder);
      } else {
        await updateMutation.mutateAsync({ id: productionOrder.id, patch: { status } });
      }
      toast.success(`Production order marked ${productionOrderStatusMeta[status].label}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const isPending = updateMutation.isPending || cancelMutation.isPending;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          Change Status <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((status) => (
          <DropdownMenuItem
            key={status}
            variant={status === "cancelled" ? "destructive" : "default"}
            onSelect={() => handleChange(status)}
          >
            Mark as {productionOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
