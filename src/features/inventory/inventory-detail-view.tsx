"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, FileText, PackageX, SlidersHorizontal } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { getAvailableStock, getOnOrderQuantity, getStockStatus } from "@/lib/inventory-utils";
import { purchaseOrderStatusMeta, stockLevelMeta, stockMovementTypeMeta } from "@/lib/status";
import { inventoryHooks } from "@/features/inventory/service";
import { StockAdjustmentSheet } from "@/features/inventory/stock-adjustment-sheet";
import { StockTransferSheet } from "@/features/inventory/stock-transfer-sheet";
import { goodsReceiptHooks, purchaseOrderHooks } from "@/features/purchasing/service";
import { materialHooks } from "@/features/materials/service";
import { storageLocationHooks, warehouseHooks } from "@/features/warehouses/service";
import { mockMaterialGroups, mockSuppliers, mockUnitsOfMeasure } from "@/mock-data";
import type { InventoryBalance } from "@/types";

function emptyBalance(materialId: string): InventoryBalance {
  return {
    id: materialId,
    materialId,
    onHand: 0,
    reserved: 0,
    rejected: 0,
    reorderPoint: 0,
    minimumStock: 0,
    unitCost: 0,
    locations: [],
    lastMovementDate: "",
  };
}

export function InventoryDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: material, isLoading: materialLoading } = materialHooks.useDetail(id);
  const { data: balance, isLoading: balanceLoading } = inventoryHooks.useDetail(id);
  const { data: movements = [] } = inventoryHooks.useMovementsByMaterial(id);
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();
  const { data: goodsReceipts = [] } = goodsReceiptHooks.useList();
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: locations = [] } = storageLocationHooks.useList();

  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const relatedPos = useMemo(
    () => purchaseOrders.filter((po) => po.items.some((item) => item.materialId === id)),
    [purchaseOrders, id],
  );
  const relatedReceipts = useMemo(
    () => goodsReceipts.filter((grn) => grn.items.some((item) => item.materialId === id)),
    [goodsReceipts, id],
  );

  if (materialLoading || balanceLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-5">
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (!material) {
    return (
      <EmptyState
        icon={PackageX}
        title="Material not found"
        description="This material may have been removed."
        action={{ label: "Back to Inventory", onClick: () => router.push("/inventory/stock") }}
      />
    );
  }

  const resolvedBalance = balance ?? emptyBalance(id);
  const available = getAvailableStock(resolvedBalance);
  const onOrder = getOnOrderQuantity(id, purchaseOrders);
  const status = getStockStatus(resolvedBalance);
  const statusMeta = stockLevelMeta[status];
  const unit = mockUnitsOfMeasure.find((u) => u.id === material.uomId)?.code ?? "";
  const groupName = mockMaterialGroups.find((g) => g.id === material.materialGroupId)?.name ?? "—";
  const supplierName = material.supplierId ? mockSuppliers.find((s) => s.id === material.supplierId)?.name : undefined;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/inventory/stock"
        backLabel="Back to Inventory"
        title={material.name}
        subtitle={`${material.code} · ${groupName}`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft /> Transfer Stock
            </Button>
            <Button variant="outline" onClick={() => setAdjustOpen(true)}>
              <SlidersHorizontal /> Adjust Stock
            </Button>
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stock">Stock</TabsTrigger>
              <TabsTrigger value="movements">Movements ({movements.length})</TabsTrigger>
              <TabsTrigger value="orders">Purchase Orders ({relatedPos.length})</TabsTrigger>
              <TabsTrigger value="receipts">Receipts ({relatedReceipts.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">On Hand</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {resolvedBalance.onHand.toLocaleString()} {unit}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Reserved</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {resolvedBalance.reserved.toLocaleString()} {unit}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Available</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {available.toLocaleString()} {unit}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">On Order</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {onOrder.toLocaleString()} {unit}
                    </span>
                  </div>
                </div>
                {resolvedBalance.rejected > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {resolvedBalance.rejected.toLocaleString()} {unit} rejected on inspection — not included in usable stock.
                  </p>
                )}
              </Card>

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Category / Group</span>
                  <span className="text-sm font-medium text-foreground">{groupName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Unit</span>
                  <span className="text-sm font-medium text-foreground">{unit}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Reorder Point</span>
                  <span className="text-sm font-medium text-foreground">
                    {resolvedBalance.reorderPoint.toLocaleString()} {unit}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Minimum Stock</span>
                  <span className="text-sm font-medium text-foreground">
                    {resolvedBalance.minimumStock.toLocaleString()} {unit}
                  </span>
                </div>
                {supplierName && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Preferred Supplier</span>
                    <span className="text-sm font-medium text-foreground">{supplierName}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Material Master</span>
                  <button
                    type="button"
                    onClick={() => router.push(`/masters/materials/${id}`)}
                    className="w-fit text-sm font-medium text-primary hover:underline"
                  >
                    View material record
                  </button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="mt-4">
              {resolvedBalance.locations.length === 0 ? (
                <EmptyState icon={PackageX} title="Not currently stocked" description="This material has no recorded stock at any location." />
              ) : (
                <div className="flex flex-col gap-3">
                  {resolvedBalance.locations.map((loc) => {
                    const warehouse = warehouses.find((w) => w.id === loc.warehouseId);
                    const location = locations.find((l) => l.id === loc.locationId);
                    return (
                      <Card key={`${loc.warehouseId}-${loc.locationId}`} className="flex items-center justify-between p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{warehouse?.name ?? "—"}</span>
                          <span className="text-xs text-muted-foreground">{location?.name ?? "—"}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {loc.quantity.toLocaleString()} {unit}
                        </span>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="movements" className="mt-4">
              {movements.length === 0 ? (
                <EmptyState icon={FileText} title="No movements yet" description="Receipts, issues, transfers and adjustments will appear here." />
              ) : (
                <Card className="hidden overflow-hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => {
                        const meta = stockMovementTypeMeta[movement.type];
                        return (
                          <TableRow key={movement.id}>
                            <TableCell className="text-muted-foreground">{formatDate(movement.timestamp)}</TableCell>
                            <TableCell>
                              <StatusBadge label={meta.label} level={meta.level} hideIcon />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {movement.quantity > 0 ? "+" : ""}
                              {movement.quantity.toLocaleString()} {movement.unit}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{movement.reference ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{movement.performedBy}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
              {movements.length > 0 && (
                <div className="flex flex-col gap-3 md:hidden">
                  {movements.map((movement) => {
                    const meta = stockMovementTypeMeta[movement.type];
                    return (
                      <Card key={movement.id} className="flex flex-col gap-1 p-4">
                        <div className="flex items-center justify-between">
                          <StatusBadge label={meta.label} level={meta.level} hideIcon />
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {movement.quantity > 0 ? "+" : ""}
                            {movement.quantity.toLocaleString()} {movement.unit}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(movement.timestamp)} · {movement.performedBy}
                          {movement.reference ? ` · ${movement.reference}` : ""}
                        </span>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              {relatedPos.length === 0 ? (
                <EmptyState icon={FileText} title="No purchase orders yet" description="Purchase orders that include this material will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {relatedPos.map((po) => {
                    const meta = purchaseOrderStatusMeta[po.status];
                    const item = po.items.find((i) => i.materialId === id);
                    return (
                      <Card
                        key={po.id}
                        className="flex cursor-pointer items-center justify-between p-4 hover:border-primary/40"
                        onClick={() => router.push(`/purchasing/orders/${po.id}`)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{po.poNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {po.supplierName} · {item?.quantity.toLocaleString()} {item?.unit} ordered · {item?.receivedQuantity.toLocaleString()} received
                          </span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="receipts" className="mt-4">
              {relatedReceipts.length === 0 ? (
                <EmptyState icon={FileText} title="No receipts yet" description="Goods receipts that include this material will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {relatedReceipts.map((grn) => {
                    const item = grn.items.find((i) => i.materialId === id);
                    return (
                      <Card
                        key={grn.id}
                        className="flex cursor-pointer items-center justify-between p-4 hover:border-primary/40"
                        onClick={() => router.push(`/purchasing/orders/${grn.poId}`)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{grn.grnNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {grn.supplierName} · Received {formatDate(grn.receivedDate)}
                            {item ? ` · ${item.acceptedQuantity.toLocaleString()} accepted` : ""}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              {movements.length === 0 ? (
                <EmptyState icon={FileText} title="No activity yet" description="A timeline of stock changes will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {movements.map((movement) => (
                    <Card key={movement.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {movement.performedBy} {movement.quantity >= 0 ? "added" : "removed"}{" "}
                          {Math.abs(movement.quantity).toLocaleString()} {movement.unit} ({stockMovementTypeMeta[movement.type].label.toLowerCase()})
                        </span>
                        {movement.reason && <span className="text-xs text-muted-foreground">{movement.reason}</span>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(movement.timestamp)}</span>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        }
      />

      <StockTransferSheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        materialId={id}
        materialName={material.name}
        unit={unit}
        balance={resolvedBalance}
      />
      <StockAdjustmentSheet
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        materialId={id}
        materialName={material.name}
        unit={unit}
        balance={resolvedBalance}
      />
    </div>
  );
}
