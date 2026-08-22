"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Boxes, IndianRupee, PackageX, ShoppingCart } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Pagination, usePagination } from "@/components/shared/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getAvailableStock, getInventoryValue, getStockStatus } from "@/lib/inventory-utils";
import { purchaseOrderStatusMeta, purchaseRequestStatusMeta, stockLevelMeta } from "@/lib/status";
import { inventoryHooks } from "@/features/inventory/service";
import { materialHooks } from "@/features/materials/service";
import { purchaseOrderHooks, purchaseRequestHooks } from "@/features/purchasing/service";
import { mockMaterialGroups } from "@/mock-data";
import type { InventoryBalance, Material, StockLevel } from "@/types";

interface AttentionRow {
  id: string;
  material: Material;
  balance: InventoryBalance;
  status: StockLevel;
}

export function InventoryPurchasingReport() {
  const router = useRouter();
  const { data: materials = [], isLoading: materialsLoading } = materialHooks.useList();
  const { data: balances = [], isLoading: balancesLoading } = inventoryHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();
  const { data: purchaseRequests = [] } = purchaseRequestHooks.useList();

  const isLoading = materialsLoading || balancesLoading;
  const today = new Date().toISOString().slice(0, 10);

  const attentionRows: AttentionRow[] = useMemo(() => {
    return materials
      .filter((m) => m.status === "active")
      .map((material) => {
        const balance = balances.find((b) => b.materialId === material.id);
        const zero: InventoryBalance = { id: material.id, materialId: material.id, onHand: 0, reserved: 0, rejected: 0, reorderPoint: 0, minimumStock: 0, unitCost: 0, locations: [], lastMovementDate: "" };
        const resolved = balance ?? zero;
        return { id: material.id, material, balance: resolved, status: getStockStatus(resolved) };
      })
      .filter((row) => row.status !== "healthy")
      .sort((a, b) => getAvailableStock(a.balance) - getAvailableStock(b.balance));
  }, [materials, balances]);

  const stats = useMemo(() => {
    const total = materials.filter((m) => m.status === "active").length;
    const low = attentionRows.filter((r) => r.status === "low" || r.status === "critical").length;
    const outOfStock = attentionRows.filter((r) => r.status === "out_of_stock").length;
    const value = materials.reduce((sum, m) => {
      const balance = balances.find((b) => b.materialId === m.id);
      return sum + (balance ? getInventoryValue(balance) : 0);
    }, 0);
    return { total, low, outOfStock, value };
  }, [materials, balances, attentionRows]);

  const purchaseAttention = useMemo(() => {
    const prRows = purchaseRequests.filter((pr) => pr.status === "pending_approval");
    const poRows = purchaseOrders.filter((po) => po.status === "pending_approval" || (["sent", "partially_received"].includes(po.status) && po.expectedDate < today));
    return { prRows, poRows };
  }, [purchaseRequests, purchaseOrders, today]);

  const { page, pageCount, pageRows, setPage, pageSize, totalCount } = usePagination(attentionRows, 10);

  const columns: MasterDataColumn<AttentionRow>[] = [
    { key: "code", header: "Code", render: (row) => <span className="font-medium text-foreground">{row.material.code}</span> },
    { key: "name", header: "Material", render: (row) => row.material.name },
    { key: "available", header: "Available", align: "right", render: (row) => getAvailableStock(row.balance).toLocaleString() },
    { key: "reorder", header: "Reorder Point", align: "right", render: (row) => row.balance.reorderPoint.toLocaleString() },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const meta = stockLevelMeta[row.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Materials" value={stats.total.toString()} icon={Boxes} />
        <StatCard label="Low / Critical Stock" value={stats.low.toString()} icon={AlertTriangle} accent={stats.low > 0 ? "warning" : "success"} href="/inventory/low-stock" />
        <StatCard label="Out of Stock" value={stats.outOfStock.toString()} icon={PackageX} accent={stats.outOfStock > 0 ? "critical" : "success"} />
        <StatCard label="Estimated Stock Value" value={formatCurrency(stats.value)} icon={IndianRupee} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materials Needing Attention</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {attentionRows.length === 0 ? (
            <EmptyState icon={Boxes} title="Everything is healthy" description="No materials are currently low, critical or out of stock." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={pageRows} onRowClick={(row) => router.push(`/inventory/stock/${row.material.id}`)} />
              <MasterDataCards
                rows={pageRows}
                renderCard={(row) => {
                  const meta = stockLevelMeta[row.status];
                  return (
                    <Card key={row.material.id} className="flex items-center justify-between p-4" onClick={() => router.push(`/inventory/stock/${row.material.id}`)}>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{row.material.name}</span>
                        <span className="text-xs text-muted-foreground">{row.material.code} · {mockMaterialGroups.find((g) => g.id === row.material.materialGroupId)?.name ?? "—"}</span>
                      </div>
                      <StatusBadge label={meta.label} level={meta.level} />
                    </Card>
                  );
                }}
              />
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalCount={totalCount} pageSize={pageSize} />
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Purchase Requests Pending Approval" value={purchaseAttention.prRows.length.toString()} icon={ShoppingCart} accent={purchaseAttention.prRows.length > 0 ? "warning" : "success"} href="/purchasing" />
        <StatCard label="Purchase Orders Needing Attention" value={purchaseAttention.poRows.length.toString()} icon={ShoppingCart} accent={purchaseAttention.poRows.length > 0 ? "warning" : "success"} href="/purchasing" />
      </div>

      {(purchaseAttention.prRows.length > 0 || purchaseAttention.poRows.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Purchasing Needing Attention</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {purchaseAttention.prRows.map((pr) => (
              <Card key={pr.id} className="flex cursor-pointer items-center justify-between p-3" onClick={() => router.push(`/purchasing/requests/${pr.id}`)}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{pr.requestNumber} — {pr.materialName}</span>
                  <span className="text-xs text-muted-foreground">{pr.quantity.toLocaleString()} {pr.unit} · {pr.requestedBy}</span>
                </div>
                <StatusBadge label={purchaseRequestStatusMeta[pr.status].label} level={purchaseRequestStatusMeta[pr.status].level} />
              </Card>
            ))}
            {purchaseAttention.poRows.map((po) => (
              <Card key={po.id} className="flex cursor-pointer items-center justify-between p-3" onClick={() => router.push(`/purchasing/orders/${po.id}`)}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{po.poNumber} — {po.supplierName}</span>
                  <span className="text-xs text-muted-foreground">Expected {po.expectedDate} · {formatCurrency(po.totalValue)}</span>
                </div>
                <StatusBadge label={purchaseOrderStatusMeta[po.status].label} level={purchaseOrderStatusMeta[po.status].level} />
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
