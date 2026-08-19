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
import { getNextPrStatusOptions } from "@/lib/purchasing-utils";
import { purchaseRequestStatusMeta } from "@/lib/status";
import { purchaseRequestHooks } from "@/features/purchasing/service";
import type { PurchaseRequest, PurchaseRequestStatus } from "@/types";

export function PurchaseRequestStatusMenu({ request }: { request: PurchaseRequest }) {
  const updateMutation = purchaseRequestHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextPrStatusOptions(request.status);

  if (options.length === 0) return null;

  async function handleChange(status: PurchaseRequestStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: request.id, patch: { status } });
      toast.success(`Request marked ${purchaseRequestStatusMeta[status].label}`);
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
            variant={status === "rejected" || status === "cancelled" ? "destructive" : "default"}
            onSelect={() => handleChange(status)}
          >
            Mark as {purchaseRequestStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
