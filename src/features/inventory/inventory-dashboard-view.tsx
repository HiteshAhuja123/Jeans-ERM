"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  Boxes,
  CircleCheck,
  CircleX,
  ClipboardList,
  IndianRupee,
  PackageX,
  ShoppingCart,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getInventoryValue, getStockStatus } from "@/lib/inventory-utils";
import { stockMovementTypeMeta } from "@/lib/status";
import { inventoryHooks } from "@/features/inventory/service";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import { materialHooks } from "@/features/materials/service";
import type { StatusLevel, StockLevel } from "@/types";

const healthMeta: Record<StockLevel, { label: string; icon: typeof CircleCheck; level: StatusLevel }> = {
  healthy: { label: "Healthy Stock", icon: CircleCheck, level: "success" },
  low: { label: "Low Stock", icon: AlertTriangle, level: "warning" },
  critical: { label: "Critical", icon: AlertOctagon, level: "critical" },
  out_of_stock: { label: "Out of Stock", icon: CircleX, level: "critical" },
};

const healthIconWrapClasses: Record<StatusLevel, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  critical: "bg-critical-subtle text-critical",
  info: "bg-info-subtle text-info",
  neutral: "bg-muted text-muted-foreground",
};

export function InventoryDashboardView() {
  const { data: materials = [] } = materialHooks.useList();
  const { data: balances = [], isLoading } = inventoryHooks.useList();
  const { data: movements = [] } = inventoryHooks.useMovements();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();

  const activeMaterials = useMemo(() => materials.filter((m) => m.status === "active"), [materials]);

  const health = useMemo(() => {
    const counts: Record<StockLevel, number> = { healthy: 0, low: 0, critical: 0, out_of_stock: 0 };
    for (const material of activeMaterials) {
      const balance = balances.find((b) => b.materialId === material.id);
      const status = balance
        ? getStockStatus(balance)
        : getStockStatus({ onHand: 0, reserved: 0, reorderPoint: 0, minimumStock: 0 });
      counts[status] += 1;
    }
    return counts;
  }, [activeMaterials, balances]);

  const stockValue = useMemo(() => balances.reduce((sum, b) => sum + getInventoryValue(b), 0), [balances]);

  const pendingReceipts = purchaseOrders.filter((po) => po.status === "sent" || po.status === "partially_received").length;

  const today = new Date().toISOString().slice(0, 10);
  const overduePOs = purchaseOrders.filter(
    (po) => (po.status === "sent" || po.status === "partially_received") && po.expectedDate < today,
  );

  const adjustmentCount = movements.filter((m) => m.type === "adjustment").length;

  const warnings: Array<{ level: StatusLevel; message: string; href: string }> = [
    health.low + health.critical > 0
      ? { level: "warning", message: `${health.low + health.critical} materials below reorder point`, href: "/inventory/low-stock" }
      : null,
    health.out_of_stock > 0
      ? { level: "critical", message: `${health.out_of_stock} materials out of stock`, href: "/inventory/stock?stock=attention" }
      : null,
    overduePOs.length > 0
      ? { level: "critical", message: `${overduePOs.length} purchase orders overdue`, href: "/purchasing" }
      : null,
    adjustmentCount > 0
      ? { level: "info", message: `${adjustmentCount} stock adjustments logged recently`, href: "/inventory/movements" }
      : null,
  ].filter((w): w is { level: StatusLevel; message: string; href: string } => w !== null);

  const recentMovements = [...movements]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory Dashboard" description="What's happening with your inventory right now" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Materials" value={activeMaterials.length.toString()} icon={Boxes} href="/inventory/stock" />
        <StatCard
          label="Low Stock"
          value={(health.low + health.critical).toString()}
          icon={AlertTriangle}
          accent={health.low + health.critical > 0 ? "warning" : "success"}
          href="/inventory/low-stock"
        />
        <StatCard
          label="Out of Stock"
          value={health.out_of_stock.toString()}
          icon={PackageX}
          accent={health.out_of_stock > 0 ? "critical" : "success"}
          href="/inventory/stock?stock=attention"
        />
        <StatCard label="Pending Receipts" value={pendingReceipts.toString()} icon={ClipboardList} accent="info" href="/purchasing" />
        <StatCard label="Purchase Orders" value={purchaseOrders.length.toString()} icon={ShoppingCart} href="/purchasing" />
        <StatCard label="Estimated Stock Value" value={formatCurrency(stockValue)} icon={IndianRupee} helpText="Operational estimate" />
      </div>

      {warnings.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="text-sm font-semibold text-foreground">Needs attention</span>
          {warnings.map((warning, index) => (
            <Link
              key={index}
              href={warning.href}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:opacity-80 ${
                warning.level === "critical"
                  ? "border-critical/25 bg-critical-subtle text-critical"
                  : warning.level === "warning"
                    ? "border-warning/25 bg-warning-subtle text-warning"
                    : "border-info/25 bg-info-subtle text-info"
              }`}
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              {warning.message}
            </Link>
          ))}
        </Card>
      )}

      <Card className="p-5">
        <span className="text-sm font-semibold text-foreground">Inventory Health</span>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(Object.keys(health) as StockLevel[]).map((level) => {
            const meta = healthMeta[level];
            const Icon = meta.icon;
            return (
              <div key={level} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className={`flex size-9 items-center justify-center rounded-lg ${healthIconWrapClasses[meta.level]}`}>
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold tabular-nums text-foreground">{health[level]}</span>
                  <span className="text-xs text-muted-foreground">{meta.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <span className="text-sm font-semibold text-foreground">Recent Activity</span>
        <div className="mt-3 flex flex-col divide-y divide-border">
          {recentMovements.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No recent stock activity.</p>
          ) : (
            recentMovements.map((movement) => {
              const meta = stockMovementTypeMeta[movement.type];
              return (
                <div key={movement.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity.toLocaleString()} {movement.unit} · {movement.materialName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {meta.label}
                      {movement.reference ? ` · ${movement.reference}` : ""} · {movement.performedBy}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(movement.timestamp)}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
