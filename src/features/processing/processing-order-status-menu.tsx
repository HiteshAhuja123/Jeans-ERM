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
import { getNextProcessingOrderStatusOptions } from "@/lib/post-sewing-utils";
import { processingOrderStatusMeta } from "@/lib/status";
import { processingOrderHooks } from "@/features/processing/service";
import type { ProcessingOrder, ProcessingOrderStatus } from "@/types";

/** "On Hold" is reached through the dedicated Hold action, not this menu. */
export function ProcessingOrderStatusMenu({ processingOrder }: { processingOrder: ProcessingOrder }) {
  const updateMutation = processingOrderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextProcessingOrderStatusOptions(processingOrder.status);

  if (options.length === 0) return null;

  async function handleChange(status: ProcessingOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: processingOrder.id, patch: { status } });
      toast.success(`Processing order marked ${processingOrderStatusMeta[status].label}`);
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
            Mark as {processingOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
