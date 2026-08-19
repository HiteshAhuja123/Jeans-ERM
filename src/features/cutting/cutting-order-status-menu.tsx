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
import { getNextCuttingOrderStatusOptions } from "@/lib/cutting-utils";
import { cuttingOrderStatusMeta } from "@/lib/status";
import { cuttingOrderHooks } from "@/features/cutting/service";
import type { CuttingOrder, CuttingOrderStatus } from "@/types";

/** "on_hold" and "in_progress" are reached through the dedicated Hold/Resume/Start Cutting actions, not this menu. */
export function CuttingOrderStatusMenu({ cuttingOrder }: { cuttingOrder: CuttingOrder }) {
  const updateMutation = cuttingOrderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextCuttingOrderStatusOptions(cuttingOrder.status).filter((s) => s !== "on_hold" && s !== "in_progress");

  if (options.length === 0) return null;

  async function handleChange(status: CuttingOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: cuttingOrder.id, patch: { status } });
      toast.success(`Cutting order marked ${cuttingOrderStatusMeta[status].label}`);
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
            Mark as {cuttingOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
