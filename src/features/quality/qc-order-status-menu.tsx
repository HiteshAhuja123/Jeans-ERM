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
import { getNextQcOrderStatusOptions } from "@/lib/post-sewing-utils";
import { qcOrderStatusMeta } from "@/lib/status";
import { qcOrderHooks } from "@/features/quality/service";
import type { QcOrder, QcOrderStatus } from "@/types";

/** "On Hold" is reached through the dedicated Hold action, and "Approved" is derived automatically — neither is set through this menu. */
export function QcOrderStatusMenu({ qcOrder }: { qcOrder: QcOrder }) {
  const updateMutation = qcOrderHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextQcOrderStatusOptions(qcOrder.status);

  if (options.length === 0) return null;

  async function handleChange(status: QcOrderStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: qcOrder.id, patch: { status } });
      toast.success(`QC order marked ${qcOrderStatusMeta[status].label}`);
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
            Mark as {qcOrderStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
