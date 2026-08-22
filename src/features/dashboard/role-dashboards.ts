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
    alertModules: ["Orders", "Production"],
  },
  production_supervisor: {
    greeting: "Here's how your lines are tracking today.",
    showChart: true,
    showProductionSnapshot: true,
    showAlerts: true,
    showApprovals: false,
    alertModules: ["Orders", "Production"],
  },
  qc_manager: {
    greeting: "Here's today's quality snapshot.",
    showChart: false,
    showProductionSnapshot: false,
    showAlerts: true,
    showApprovals: false,
    alertModules: ["Quality"],
  },
  qc_staff: {
    greeting: "Here's today's quality queue.",
    showChart: false,
    showProductionSnapshot: false,
    showAlerts: true,
    showApprovals: false,
    alertModules: ["Quality"],
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
  cutting_staff: {
    greeting: "Here's today's cutting queue.",
    showChart: false,
    showProductionSnapshot: true,
    showAlerts: false,
    showApprovals: false,
  },
  sewing_staff: {
    greeting: "Here's today's sewing queue.",
    showChart: false,
    showProductionSnapshot: true,
    showAlerts: false,
    showApprovals: false,
  },
  packing_staff: {
    greeting: "Here's today's packing queue.",
    showChart: false,
    showProductionSnapshot: false,
    showAlerts: true,
    showApprovals: false,
    alertModules: ["Packing"],
  },
  dispatch_staff: {
    greeting: "Here's today's dispatch queue.",
    showChart: false,
    showProductionSnapshot: false,
    showAlerts: false,
    showApprovals: false,
  },
  admin_staff: {
    greeting: "What's happening in your factory today.",
    showChart: true,
    showProductionSnapshot: true,
    showAlerts: true,
    showApprovals: true,
  },
};

export function getDashboardProfile(role: Role): DashboardProfile {
  return dashboardProfiles[role] ?? DEFAULT_PROFILE;
}
