import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CalendarDays,
  ClipboardList,
  Database,
  Droplets,
  Layers,
  LayoutDashboard,
  Package,
  PackageSearch,
  Scissors,
  Shirt,
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
    | "cuttingAlerts"
    | "sewingAlerts"
    | "processingAlerts"
    | "finishingAlerts"
    | "qcAlerts"
    | "packingAlerts";
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
    label: "Sewing",
    items: [
      {
        label: "Sewing",
        href: "/sewing",
        icon: Shirt,
        description: "Sewing dashboard, work queue & production",
        badgeKey: "sewingAlerts",
      },
      {
        label: "Sewing Orders",
        href: "/sewing/orders",
        icon: ClipboardList,
        description: "Sewing orders, bundle & line assignment",
      },
      {
        label: "Sewing Schedule",
        href: "/sewing/schedule",
        icon: CalendarDays,
        description: "Sewing line schedule & calendar",
      },
    ],
  },
  {
    label: "Post-Sewing",
    items: [
      {
        label: "Processing",
        href: "/processing",
        icon: Droplets,
        description: "Washing/processing — internal & outsourced batches",
        badgeKey: "processingAlerts",
      },
      {
        label: "Finishing",
        href: "/finishing",
        icon: Shirt,
        description: "Pressing, trimming & final finishing",
        badgeKey: "finishingAlerts",
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
        description: "Fabric & accessories",
        badgeKey: "lowStock",
      },
      {
        label: "Finished Goods",
        href: "/inventory/finished-goods",
        icon: Package,
        description: "Packed, dispatch-ready stock by production order",
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
        description: "Inspection, pass/fail, rework & approval",
        badgeKey: "qcAlerts",
      },
    ],
  },
  {
    label: "Packing & Dispatch",
    items: [
      {
        label: "Packing",
        href: "/packing",
        icon: Package,
        description: "Cartonize QC-approved garments",
        badgeKey: "packingAlerts",
      },
      {
        label: "Dispatch",
        href: "/dispatch",
        icon: Ship,
        description: "Fulfillment dashboard & shipments",
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
