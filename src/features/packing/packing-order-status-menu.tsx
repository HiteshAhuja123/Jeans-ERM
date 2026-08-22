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
import { getNextPackingOrderStatusOptions } from "@/lib/packing-utils";
import { packingOrderStatusMeta } from "@/lib/status";
import { packingOrderHooks } from "@/features/packing/service";
import type { PackingOrder, PackingOrderStatus } from "@/types";

/** "On Hold" is reached through the dedicated Hold action, not this menu. */
export function PackingOrderStatusMenu({ packingOrder }: { packingOrder: PackingOrder }) {
  const updateMutation = packingOrderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextPackingOrderStatusOptions(packingOrder.status);

  if (options.length === 0) return null;

  async function handleChange(status: PackingOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: packingOrder.id, patch: { status } });
      toast.success(`Packing order marked ${packingOrderStatusMeta[status].label}`);
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
            Mark as {packingOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
