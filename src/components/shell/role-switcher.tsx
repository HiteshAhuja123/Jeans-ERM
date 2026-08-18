"use client";

import { Eye } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole } from "@/lib/role-context";
import { roleLabels } from "@/mock-data/users";
import type { Role } from "@/types";

const previewableRoles: Role[] = [
  "owner",
  "production_manager",
  "production_supervisor",
  "store_manager",
  "purchase_manager",
  "qc_manager",
];

export function RoleSwitcher() {
  const { previewRole, setPreviewRole } = useRole();

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wide text-sidebar-foreground/45 uppercase">
        <Eye className="size-3" aria-hidden="true" />
        Preview dashboard as
      </span>
      <Select value={previewRole} onValueChange={(value) => setPreviewRole(value as Role)}>
        <SelectTrigger className="w-full border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {previewableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {roleLabels[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
