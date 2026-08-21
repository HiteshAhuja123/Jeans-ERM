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
import { getNextFinishingOrderStatusOptions } from "@/lib/post-sewing-utils";
import { finishingOrderStatusMeta } from "@/lib/status";
import { finishingOrderHooks } from "@/features/finishing/service";
import type { FinishingOrder, FinishingOrderStatus } from "@/types";

/** "On Hold" is reached through the dedicated Hold action, not this menu. */
export function FinishingOrderStatusMenu({ finishingOrder }: { finishingOrder: FinishingOrder }) {
  const updateMutation = finishingOrderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextFinishingOrderStatusOptions(finishingOrder.status);

  if (options.length === 0) return null;

  async function handleChange(status: FinishingOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: finishingOrder.id, patch: { status } });
      toast.success(`Finishing order marked ${finishingOrderStatusMeta[status].label}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={updateMutation.isPending}>
          Change Status <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((status) => (
          <DropdownMenuItem key={status} variant={status === "cancelled" ? "destructive" : "default"} onSelect={() => handleChange(status)}>
            Mark as {finishingOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
