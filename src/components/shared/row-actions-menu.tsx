"use client";

import { Eye, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MasterStatus } from "@/types";

interface RowActionsMenuProps {
  status: MasterStatus;
  onView?: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

export function RowActionsMenu({ status, onView, onEdit, onToggleStatus }: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Row actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {onView && (
          <DropdownMenuItem onSelect={onView}>
            <Eye /> View details
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onToggleStatus} variant={status === "active" ? "destructive" : "default"}>
          {status === "active" ? (
            <>
              <PowerOff /> Deactivate
            </>
          ) : (
            <>
              <Power /> Activate
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
