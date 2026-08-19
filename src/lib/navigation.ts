import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CalendarDays,
  ClipboardList,
  Database,
  Layers,
  LayoutDashboard,
  Package,
  PackageSearch,
  Scissors,
  ShoppingCart,
  Ship,
  Settings,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Shown as a small tag on the sidebar item, e.g. an open-item count. */
  badgeKey?:
    | "delayedOrders"
    | "lowStock"
    | "openDefects"
    | "pendingApprovals"
    | "openPurchaseOrders"
    | "productionAlerts"
    | "cuttingAlerts";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Factory-wide status at a glance",
      },
    ],
  },
  {
    label: "Orders",
    items: [
      {
        label: "Orders",
        href: "/orders",
        icon: Package,
        description: "Customer & production orders",
        badgeKey: "delayedOrders",
      },
    ],
  },
  {
    label: "Production",
    items: [
      {
        label: "Production",
        href: "/production",
        icon: Boxes,
        description: "Cutting, sewing, washing, finishing",
        badgeKey: "productionAlerts",
      },
      {
        label: "Planning",
        href: "/production/planning",
        icon: ClipboardList,
        description: "What needs to be manufactured next",
      },
      {
        label: "Production Orders",
        href: "/production/orders",
        icon: Package,
        description: "Production orders & plans",
      },
      {
        label: "Schedule",
        href: "/production/schedule",
        icon: CalendarDays,
        description: "Line schedule & calendar",
      },
    ],
  },
  {
    label: "Cutting",
    items: [
      {
        label: "Cutting",
        href: "/cutting",
        icon: Scissors,
        description: "Cutting dashboard, work queue & batches",
        badgeKey: "cuttingAlerts",
      },
      {
        label: "Bundles",
        href: "/cutting/bundles",
        icon: Layers,
        description: "Bundle traceability & ready-for-sewing status",
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Inventory",
        href: "/inventory",
        icon: PackageSearch,
        description: "Fabric, accessories & finished goods",
        badgeKey: "lowStock",
      },
    ],
  },
  {
    label: "Purchasing",
    items: [
      {
        label: "Purchasing",
        href: "/purchasing",
        icon: ShoppingCart,
        description: "Requests, purchase orders & suppliers",
        badgeKey: "openPurchaseOrders",
      },
    ],
  },
  {
    label: "Quality",
    items: [
      {
        label: "Quality",
        href: "/quality",
        icon: ShieldCheck,
        description: "Inspections, defects & rework",
        badgeKey: "openDefects",
      },
    ],
  },
  {
    label: "Packing & Dispatch",
    items: [
      {
        label: "Dispatch",
        href: "/dispatch",
        icon: Ship,
        description: "Packing, finished goods & shipping",
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        label: "Master Data",
        href: "/masters",
        icon: Database,
        description: "Customers, products, materials & factory setup",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        description: "Production & quality analytics",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Factory profile, users & configuration",
      },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

/** Primary destinations surfaced in the mobile bottom nav (max 5). */
const mobilePrimaryHrefs = ["/dashboard", "/orders", "/production", "/cutting", "/inventory"];
export const mobilePrimaryNav: NavItem[] = mobilePrimaryHrefs.map(
  (href) => allNavItems.find((item) => item.href === href)!,
);
