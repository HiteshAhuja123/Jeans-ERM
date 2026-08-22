"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { getFinishedGoodsAvailable, getFinishedGoodsOnHand, getFinishedGoodsStockLevel } from "@/lib/finished-goods-utils";
import { dispatchOrderStatusMeta, packingOrderStatusMeta, stockLevelMeta } from "@/lib/status";
import { finishedGoodsHooks } from "@/features/inventory/finished-goods-service";
import { packingOrderHooks } from "@/features/packing/service";
import { dispatchOrderHooks } from "@/features/dispatch/service";
import { warehouseHooks, storageLocationHooks } from "@/features/warehouses/service";

export function FinishedGoodsDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: balance, isLoading } = finishedGoodsHooks.useDetail(id);
  const { data: movements = [] } = finishedGoodsHooks.useMovementsByProductionOrder(id);
  const { data: packingOrders = [] } = packingOrderHooks.useList();
  const { data: dispatchOrders = [] } = dispatchOrderHooks.useList();
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: locations = [] } = storageLocationHooks.useList();

  const relatedPacking = useMemo(() => packingOrders.filter((p) => p.productionOrderId === id), [packingOrders, id]);
  const relatedDispatches = useMemo(
    () => dispatchOrders.filter((d) => d.lineItems.some((li) => li.productionOrderId === id)),
    [dispatchOrders, id],
  );

  if (isLoading) {
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

  if (!balance) {
    return (
      <EmptyState
        icon={PackageX}
        title="No finished goods for this production order"
        description="Stock appears here once a packing order for this production order has been packed."
        action={{ label: "Back to Finished Goods", onClick: () => router.push("/inventory/finished-goods") }}
      />
    );
  }

  const onHand = getFinishedGoodsOnHand(balance);
  const available = getFinishedGoodsAvailable(balance);
  const statusMeta = stockLevelMeta[getFinishedGoodsStockLevel(balance)];
  const warehouse = warehouses.find((w) => w.id === balance.warehouseId);
  const location = locations.find((l) => l.id === balance.locationId);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/inventory/finished-goods"
        backLabel="Back to Finished Goods"
        title={`${balance.styleCode} · ${balance.colorName}`}
        subtitle={`${balance.productionOrderNumber} · ${balance.orderNumber} · ${balance.customerName}`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <Button variant="outline" onClick={() => router.push(`/production/orders/${balance.productionOrderId}`)}>
            View Production Order
          </Button>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="movements">Movements ({movements.length})</TabsTrigger>
              <TabsTrigger value="packing">Packing ({relatedPacking.length})</TabsTrigger>
              <TabsTrigger value="dispatches">Dispatches ({relatedDispatches.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Packed</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">{balance.packed.toLocaleString()} {balance.unit}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Dispatched</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">{balance.dispatched.toLocaleString()} {balance.unit}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">On Hand</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">{onHand.toLocaleString()} {balance.unit}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Reserved</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">{balance.reserved.toLocaleString()} {balance.unit}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Available</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">{available.toLocaleString()} {balance.unit}</span>
                  </div>
                </div>
              </Card>

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Production Order</span>
                  <button type="button" onClick={() => router.push(`/production/orders/${balance.productionOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {balance.productionOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer Order</span>
                  <button type="button" onClick={() => router.push(`/orders/${balance.orderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {balance.orderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{balance.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Style / Color</span>
                  <span className="text-sm font-medium text-foreground">{balance.styleCode} · {balance.colorName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Location</span>
                  <span className="text-sm font-medium text-foreground">{warehouse?.name ?? "—"} · {location?.name ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Last Movement</span>
                  <span className="text-sm font-medium text-foreground">{balance.lastMovementDate ? formatDate(balance.lastMovementDate) : "—"}</span>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="movements" className="mt-4">
              {movements.length === 0 ? (
                <EmptyState icon={FileText} title="No movements yet" description="Packing receipts and dispatch issues will appear here." />
              ) : (
                <Card className="overflow-hidden">
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
                      {movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-muted-foreground">{formatDate(movement.timestamp)}</TableCell>
                          <TableCell>
                            <StatusBadge label={movement.type === "receipt" ? "Receipt" : "Issue"} level={movement.type === "receipt" ? "success" : "info"} hideIcon />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {movement.quantity > 0 ? "+" : ""}
                            {movement.quantity.toLocaleString()} {movement.unit}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{movement.reference}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {movement.performedBy} · {formatRelativeTime(movement.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="packing" className="mt-4">
              {relatedPacking.length === 0 ? (
                <EmptyState icon={FileText} title="No packing orders yet" description="Packing orders against this production order will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {relatedPacking.map((p) => {
                    const meta = packingOrderStatusMeta[p.status];
                    return (
                      <Card key={p.id} className="flex cursor-pointer items-center justify-between p-4 hover:border-primary/40" onClick={() => router.push(`/packing/${p.id}`)}>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{p.packingOrderNumber}</span>
                          <span className="text-xs text-muted-foreground">{p.quantity.toLocaleString()} pcs · {p.responsible ?? "Unassigned"}</span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="dispatches" className="mt-4">
              {relatedDispatches.length === 0 ? (
                <EmptyState icon={FileText} title="No dispatches yet" description="Dispatches that draw from this production order's stock will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {relatedDispatches.map((d) => {
                    const meta = dispatchOrderStatusMeta[d.status];
                    const lineQty = d.lineItems.find((li) => li.productionOrderId === id)?.quantity ?? 0;
                    return (
                      <Card key={d.id} className="flex cursor-pointer items-center justify-between p-4 hover:border-primary/40" onClick={() => router.push(`/dispatch/${d.id}`)}>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{d.dispatchOrderNumber}</span>
                          <span className="text-xs text-muted-foreground">{lineQty.toLocaleString()} pcs · {formatDate(d.dispatchDate)}</span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        }
      />
    </div>
  );
}
