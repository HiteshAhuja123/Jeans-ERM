"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { currentUser } from "@/mock-data/users";
import type { Role } from "@/types";

interface RoleContextValue {
  previewRole: Role;
  setPreviewRole: (role: Role) => void;
  /** True once the user has switched away from their real account role. */
  isPreviewing: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

/**
 * There's no real auth yet (Phase 16), so "role" here is a demo affordance:
 * it lets anyone preview what a given role's dashboard looks like. It never
 * changes the signed-in identity shown in the user menu.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [previewRole, setPreviewRole] = useState<Role>(currentUser.role);

  return (
    <RoleContext.Provider
      value={{ previewRole, setPreviewRole, isPreviewing: previewRole !== currentUser.role }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
