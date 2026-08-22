import { useRole } from "@/lib/role-context";
import type { NavGroup } from "@/lib/navigation";
import type { Role } from "@/types";

/**
 * Centralized role → capability map. Nothing outside this file should hardcode a role check —
 * components call `usePermissions()` and read the flags/helpers it returns.
 *
 * There is no real backend auth yet (see `role-context.tsx` — role here is still the existing
 * "preview" affordance, not a signed-in identity), so this governs what's *shown* in the UI, not
 * a security boundary. It reuses that same preview mechanism rather than adding a second one.
 */
export interface RolePermissions {
  /** "all" = every nav group visible; otherwise the exact group labels this role can see. */
  navGroups: "all" | string[];
  /** Optional per-group href allowlist — restricts a visible group to specific items (e.g. Packing staff only sees the Packing link, not Dispatch). */
  navHrefs?: string[];
  /** Can act on the dashboard's Pending Approvals queue (Purchase Requests / Purchase Orders). */
  canApprove: boolean;
  /** Can create/edit Master Data records. */
  canManageMasterData: boolean;
}

const FULL_ACCESS: RolePermissions = { navGroups: "all", canApprove: true, canManageMasterData: true };

export const rolePermissions: Record<Role, RolePermissions> = {
  owner: FULL_ACCESS,
  management: FULL_ACCESS,
  admin_staff: FULL_ACCESS,
  production_manager: {
    navGroups: ["Overview", "Orders", "Production", "Cutting", "Sewing", "Post-Sewing", "Inventory", "Quality", "Packing & Dispatch", "Insights"],
    canApprove: false,
    canManageMasterData: false,
  },
  production_supervisor: {
    navGroups: ["Overview", "Production", "Cutting", "Sewing", "Post-Sewing"],
    canApprove: false,
    canManageMasterData: false,
  },
  store_manager: {
    navGroups: ["Overview", "Inventory", "Purchasing", "Master Data", "Insights"],
    canApprove: false,
    canManageMasterData: true,
  },
  purchase_manager: {
    navGroups: ["Overview", "Inventory", "Purchasing", "Insights"],
    canApprove: true,
    canManageMasterData: false,
  },
  qc_manager: {
    navGroups: ["Overview", "Quality", "Post-Sewing", "Insights"],
    canApprove: false,
    canManageMasterData: false,
  },
  qc_staff: {
    navGroups: ["Overview", "Quality"],
    canApprove: false,
    canManageMasterData: false,
  },
  cutting_staff: {
    navGroups: ["Overview", "Cutting"],
    canApprove: false,
    canManageMasterData: false,
  },
  sewing_staff: {
    navGroups: ["Overview", "Sewing"],
    canApprove: false,
    canManageMasterData: false,
  },
  packing_staff: {
    navGroups: ["Overview", "Packing & Dispatch"],
    navHrefs: ["/packing"],
    canApprove: false,
    canManageMasterData: false,
  },
  dispatch_staff: {
    navGroups: ["Overview", "Packing & Dispatch", "Inventory"],
    navHrefs: ["/dispatch", "/inventory/finished-goods"],
    canApprove: false,
    canManageMasterData: false,
  },
};

export function getPermissions(role: Role): RolePermissions {
  return rolePermissions[role];
}

/** Filters the full nav config down to what this role should see — Dashboard always stays visible. */
export function getVisibleNavGroups(role: Role, groups: NavGroup[]): NavGroup[] {
  const perms = getPermissions(role);
  if (perms.navGroups === "all") return groups;
  const allowedLabels = new Set(perms.navGroups);
  return groups
    .filter((group) => allowedLabels.has(group.label))
    .map((group) => {
      if (!perms.navHrefs) return group;
      const items = group.items.filter((item) => perms.navHrefs!.includes(item.href) || item.href === "/dashboard");
      return items.length > 0 ? { ...group, items } : null;
    })
    .filter((group): group is NavGroup => group !== null);
}

export function usePermissions() {
  const { previewRole } = useRole();
  return { role: previewRole, ...getPermissions(previewRole) };
}
