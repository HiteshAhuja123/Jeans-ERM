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
import { getNextDispatchOrderStatusOptions } from "@/lib/dispatch-utils";
import { dispatchOrderStatusMeta } from "@/lib/status";
import { dispatchOrderActionHooks } from "@/features/dispatch/service";
import type { DispatchOrder, DispatchOrderStatus } from "@/types";

export function DispatchOrderStatusMenu({ dispatchOrder }: { dispatchOrder: DispatchOrder }) {
  const updateMutation = dispatchOrderActionHooks.useUpdateStatus();
  const [open, setOpen] = useState(false);
  const options = getNextDispatchOrderStatusOptions(dispatchOrder.status);

  if (options.length === 0) return null;

  async function handleChange(status: DispatchOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ dispatchOrder, status });
      toast.success(`Dispatch marked ${dispatchOrderStatusMeta[status].label}`);
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
            Mark as {dispatchOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
