"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { canReceiveAgainstPo, getPendingQuantity, getPoEditTier, getPoTotals } from "@/lib/purchasing-utils";
import { purchaseOrderStatusMeta } from "@/lib/status";
import { PoQuickEditSheet } from "@/features/purchasing/po-quick-edit-sheet";
import { PurchaseOrderStatusMenu } from "@/features/purchasing/purchase-order-status-menu";
import { goodsReceiptHooks, purchaseOrderHooks } from "@/features/purchasing/service";

export function PurchaseOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: po, isLoading } = purchaseOrderHooks.useDetail(id);
  const { data: receipts = [] } = goodsReceiptHooks.useByPo(id);
  const [editOpen, setEditOpen] = useState(false);

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

  if (!po) {
    return (
      <EmptyState
        icon={PackageX}
        title="Purchase order not found"
        description="This order may have been removed."
        action={{ label: "Back to Purchasing", onClick: () => router.push("/purchasing") }}
      />
    );
  }

  const statusMeta = purchaseOrderStatusMeta[po.status];
  const editTier = getPoEditTier(po.status);
  const totals = getPoTotals(po);
  const canReceive = canReceiveAgainstPo(po.status);

  const activity = [
    { label: `Order created — ${formatCurrency(po.totalValue)}`, timestamp: po.orderDate },
    ...(po.status !== "draft" ? [{ label: "Sent for approval / to supplier", timestamp: po.orderDate }] : []),
    ...receipts.map((grn) => ({
      label: `${grn.grnNumber} received — ${grn.items.reduce((s, i) => s + i.acceptedQuantity, 0).toLocaleString()} accepted`,
      timestamp: grn.receivedDate,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/purchasing"
        backLabel="Back to Purchasing"
        title={po.poNumber}
        subtitle={`${po.supplierName} · ${formatCurrency(po.totalValue)}`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        onEdit={editTier === "readonly" ? undefined : () => setEditOpen(true)}
        actions={
          <>
            {canReceive && <Button onClick={() => router.push(`/purchasing/orders/${id}/receive`)}>Receive Material</Button>}
            <PurchaseOrderStatusMenu po={po} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Items ({po.items.length})</TabsTrigger>
              <TabsTrigger value="receipts">Receipts ({receipts.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Supplier</span>
                  <button
                    type="button"
                    onClick={() => router.push(`/masters/suppliers/${po.supplierId}`)}
                    className="w-fit text-left text-sm font-medium text-primary hover:underline"
                  >
                    {po.supplierName}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Order Date</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(po.orderDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Expected Delivery</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(po.expectedDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(po.subtotal)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Discount / Tax</span>
                  <span className="text-sm font-medium text-foreground">
                    -{formatCurrency(po.discount)} / +{formatCurrency(po.tax)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Grand Total</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(po.totalValue)}</span>
                </div>
                {po.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{po.notes}</span>
                  </div>
                )}
              </Card>

              <Card className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Ordered</span>
                <span className="text-sm font-medium text-foreground tabular-nums">{totals.ordered.toLocaleString()}</span>
              </Card>
              <Card className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Received</span>
                <span className="text-sm font-medium text-foreground tabular-nums">{totals.received.toLocaleString()}</span>
              </Card>
              <Card className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="text-sm font-medium text-foreground tabular-nums">{totals.pending.toLocaleString()}</span>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="mt-4 flex flex-col gap-3">
              {po.items.map((item, index) => {
                const pending = getPendingQuantity(item);
                return (
                  <Card key={item.id} className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {index + 1}. {item.materialCode} — {item.materialName}
                      </span>
                      <span className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground sm:w-80">
                      <div className="flex flex-col">
                        <span>Ordered</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {item.quantity.toLocaleString()} {item.unit}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span>Received</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {item.receivedQuantity.toLocaleString()} {item.unit}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span>Pending</span>
                        <span className={`font-medium tabular-nums ${pending > 0 ? "text-warning" : "text-foreground"}`}>
                          {pending.toLocaleString()} {item.unit}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} / {item.unit}
                    </span>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="receipts" className="mt-4">
              {receipts.length === 0 ? (
                <EmptyState icon={FileText} title="No receipts yet" description="Confirmed receipts against this order will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {receipts.map((grn) => (
                    <Card key={grn.id} className="flex flex-col gap-1 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{grn.grnNumber}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(grn.receivedDate)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Received by {grn.receivedBy}</span>
                      <div className="mt-1 flex flex-col gap-1">
                        {grn.items.map((item) => (
                          <span key={item.id} className="text-xs text-foreground">
                            {item.materialName}: {item.acceptedQuantity.toLocaleString()} accepted
                            {item.rejectedQuantity > 0 ? `, ${item.rejectedQuantity.toLocaleString()} rejected` : ""} ({item.unit})
                          </span>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="flex flex-col gap-3">
                {activity.map((entry, index) => (
                  <Card key={index} className="flex items-center justify-between gap-3 p-4">
                    <span className="text-sm text-foreground">{entry.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        }
      />

      <PoQuickEditSheet open={editOpen} onOpenChange={setEditOpen} po={po} />
    </div>
  );
}
