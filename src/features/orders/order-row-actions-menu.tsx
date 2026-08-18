"use client";

import { Copy, Eye, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDuplicateOrder } from "@/features/orders/use-duplicate-order";
import type { Order } from "@/types";

export function OrderRowActionsMenu({ order, onView }: { order: Order; onView: () => void }) {
  const { duplicate, isDuplicating } = useDuplicateOrder();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Order actions"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={onView}>
          <Eye /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => duplicate(order)} disabled={isDuplicating}>
          <Copy /> Duplicate order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
