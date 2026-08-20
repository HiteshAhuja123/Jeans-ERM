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
import { getNextSewingOrderStatusOptions } from "@/lib/sewing-utils";
import { sewingOrderStatusMeta } from "@/lib/status";
import { sewingOrderHooks } from "@/features/sewing/service";
import type { SewingOrder, SewingOrderStatus } from "@/types";

/** "On Hold" is reached through the dedicated Hold action, not this menu. */
export function SewingOrderStatusMenu({ sewingOrder }: { sewingOrder: SewingOrder }) {
  const updateMutation = sewingOrderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextSewingOrderStatusOptions(sewingOrder.status);

  if (options.length === 0) return null;

  async function handleChange(status: SewingOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: sewingOrder.id, patch: { status } });
      toast.success(`Sewing order marked ${sewingOrderStatusMeta[status].label}`);
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
            Mark as {sewingOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
