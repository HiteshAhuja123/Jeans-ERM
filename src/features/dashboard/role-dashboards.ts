import type { Role } from "@/types";

export interface DashboardProfile {
  greeting: string;
  showChart: boolean;
  showProductionSnapshot: boolean;
  showAlerts: boolean;
  showApprovals: boolean;
  /** Restrict the alerts feed to these module names; omit to show everything. */
  alertModules?: string[];
  /** Restrict pending approvals to these types; omit to show everything. */
  approvalTypes?: string[];
}

const DEFAULT_PROFILE: DashboardProfile = {
  greeting: "Here's what's on the floor today.",
  showChart: false,
  showProductionSnapshot: true,
  showAlerts: false,
  showApprovals: false,
};

export const dashboardProfiles: Partial<Record<Role, DashboardProfile>> = {
  owner: {
    greeting: "What's happening in your factory today.",
    showChart: true,
    showProductionSnapshot: true,
    showAlerts: true,
    showApprovals: true,
  },
  management: {
    greeting: "What's happening in your factory today.",
    showChart: true,
    showProductionSnapshot: true,
    showAlerts: true,
    showApprovals: true,
  },
  production_manager: {
    greeting: "Here's how production is tracking today.",
    showChart: true,
    showProductionSnapshot: true,
    showAlerts: true,
    showApprovals: false,
    alertModules: ["Orders"],
  },
  production_supervisor: {
    greeting: "Here's how your lines are tracking today.",
    showChart: true,
    showProductionSnapshot: true,
    showAlerts: true,
    showApprovals: false,
    alertModules: ["Orders"],
  },
  qc_manager: {
    greeting: "Here's today's quality snapshot.",
    showChart: false,
    showProductionSnapshot: false,
    showAlerts: true,
    showApprovals: true,
    alertModules: ["Quality"],
    approvalTypes: ["Rework Approval"],
  },
  purchase_manager: {
    greeting: "Here's what needs your sign-off today.",
    showChart: false,
    showProductionSnapshot: false,
    showAlerts: true,
    showApprovals: true,
    alertModules: ["Inventory"],
    approvalTypes: ["Purchase Request", "Purchase Order"],
  },
  store_manager: {
    greeting: "Here's today's stock status.",
    showChart: false,
    showProductionSnapshot: false,
    showAlerts: true,
    showApprovals: false,
    alertModules: ["Inventory"],
  },
};

export function getDashboardProfile(role: Role): DashboardProfile {
  return dashboardProfiles[role] ?? DEFAULT_PROFILE;
}
