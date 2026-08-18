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
import { getNextStatusOptions } from "@/lib/order-utils";
import { orderStatusMeta } from "@/lib/status";
import { orderHooks } from "@/features/orders/service";
import type { Order, OrderStatus } from "@/types";

export function OrderStatusMenu({ order }: { order: Order }) {
  const updateMutation = orderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextStatusOptions(order.status);

  if (options.length === 0) return null;

  async function handleChange(status: OrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: order.id, patch: { status } });
      toast.success(`Order marked ${orderStatusMeta[status].label}`);
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
            Mark as {orderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
