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
import { getNextBundleStatusOptions } from "@/lib/cutting-utils";
import { bundleStatusMeta } from "@/lib/status";
import { bundleHooks } from "@/features/cutting/bundle-service";
import type { Bundle, BundleStatus } from "@/types";

export function BundleStatusMenu({ bundle }: { bundle: Bundle }) {
  const updateMutation = bundleHooks.useUpdate();
  const [open, setOpen] = useState(false);
  const options = getNextBundleStatusOptions(bundle.status);

  if (options.length === 0) return null;

  async function handleChange(status: BundleStatus) {
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: bundle.id, patch: { status } });
      toast.success(`Bundle marked ${bundleStatusMeta[status].label}`);
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
            Mark as {bundleStatusMeta[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
