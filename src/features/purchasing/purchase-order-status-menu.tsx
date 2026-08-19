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
import { getNextPoStatusOptions } from "@/lib/purchasing-utils";
import { purchaseOrderStatusMeta } from "@/lib/status";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types";

export function PurchaseOrderStatusMenu({ po }: { po: PurchaseOrder }) {
  const updateMutation = purchaseOrderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextPoStatusOptions(po.status);

  if (options.length === 0) return null;

  async function handleChange(status: PurchaseOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: po.id, patch: { status } });
      toast.success(`Order marked ${purchaseOrderStatusMeta[status].label}`);
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
          <DropdownMenuItem
            key={status}
            variant={status === "cancelled" ? "destructive" : "default"}
            onSelect={() => handleChange(status)}
          >
            Mark as {purchaseOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
