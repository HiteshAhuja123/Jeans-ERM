"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { packingOrderStatusMeta } from "@/lib/status";
import { getPackingOrderQuantitySummary } from "@/lib/packing-utils";
import { RecordPackingDialog } from "@/features/packing/record-packing-dialog";
import { StartPackingButton } from "@/features/packing/start-packing-button";
import { PackingOrderHoldControls } from "@/features/packing/hold-controls";
import { PackingOrderStatusMenu } from "@/features/packing/packing-order-status-menu";
import { packingCartonHooks, packingEntryHooks, packingOrderHooks } from "@/features/packing/service";
import { buildPackingOrderActivity } from "@/mock-data/packing-activity";

export function PackingOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = packingOrderHooks.useDetail(id);
  const { data: entries = [] } = packingEntryHooks.useByPackingOrder(id);
  const { data: cartons = [] } = packingCartonHooks.useByPackingOrder(id);
  const [recordOpen, setRecordOpen] = useState(false);

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

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Packing order not found"
        description="This packing order may have been removed."
        action={{ label: "Back to Packing", onClick: () => router.push("/packing") }}
      />
    );
  }

  const statusMeta = packingOrderStatusMeta[order.status];
  const summary = getPackingOrderQuantitySummary(order, entries);
  const activity = buildPackingOrderActivity(order, entries);
  const canRecord = (order.status === "in_progress" || order.status === "partially_packed") && summary.remaining > 0;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/packing"
        backLabel="Back to Packing"
        title={order.packingOrderNumber}
        subtitle={`${order.qcOrderNumber} · ${order.styleCode} · ${order.colorName} · ${order.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            <StartPackingButton packingOrder={order} />
            {canRecord && <Button onClick={() => setRecordOpen(true)}>Record Packing</Button>}
            <PackingOrderHoldControls packingOrder={order} />
            <PackingOrderStatusMenu packingOrder={order} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="packing">Packing</TabsTrigger>
              <TabsTrigger value="cartons">Cartons</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <span className="text-sm font-semibold text-foreground">Packing Progress</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                  {[
                    { label: "Planned", value: summary.planned },
                    { label: "Packed", value: summary.packed },
                    { label: "Cartons", value: summary.cartons },
                    { label: "Remaining", value: summary.remaining },
                  ].map((step, index, arr) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="flex flex-col items-center rounded-lg border border-border bg-card px-3 py-2">
                        <span className="text-xs text-muted-foreground">{step.label}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{step.value.toLocaleString()}</span>
                      </div>
                      {index < arr.length - 1 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
                <LabeledProgress label="Packed vs. Planned" current={summary.packed} total={order.quantity} level={summary.packed >= order.quantity ? "success" : "info"} />
              </Card>

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">QC Order</span>
                  <button type="button" onClick={() => router.push(`/quality/${order.qcOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.qcOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Production Order</span>
                  <button type="button" onClick={() => router.push(`/production/orders/${order.productionOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.productionOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Style / Color</span>
                  <span className="text-sm font-medium text-foreground">{order.styleCode} · {order.colorName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Responsible</span>
                  <span className="text-sm font-medium text-foreground">{order.responsible ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Planned Start / End</span>
                  <span className="text-sm font-medium text-foreground">
                    {order.plannedStart ? formatDate(order.plannedStart) : "—"} – {order.plannedEnd ? formatDate(order.plannedEnd) : "—"}
                  </span>
                </div>
                {order.holdReason && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Hold Reason</span>
                    <span className="text-sm text-warning">{order.holdReason}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{order.notes}</span>
                  </div>
                )}
              </Card>

              {order.status === "packed" && (
                <p className="rounded-lg border border-success/25 bg-success-subtle px-3 py-2 text-sm text-success">
                  Fully packed — {summary.packed.toLocaleString()} pcs are now available in Finished Goods, ready for Dispatch.
                </p>
              )}
            </TabsContent>

            <TabsContent value="packing" className="mt-4">
              {entries.length === 0 ? (
                <EmptyState icon={FileText} title="No packing recorded yet" description="Record packing to see it here." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Packed</TableHead>
                        <TableHead className="text-right">Cartons</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...entries]
                        .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.packedQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.cartonCount.toLocaleString()}</TableCell>
                            <TableCell className="text-muted-foreground">{entry.notes ?? "—"}</TableCell>
                            <TableCell>{entry.recordedBy}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cartons" className="mt-4">
              {cartons.length === 0 ? (
                <EmptyState icon={FileText} title="No cartons yet" description="Cartons are created automatically when packing is recorded." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carton #</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...cartons]
                        .sort((a, b) => a.cartonNumber.localeCompare(b.cartonNumber))
                        .map((carton) => (
                          <TableRow key={carton.id}>
                            <TableCell className="font-medium text-foreground">{carton.cartonNumber}</TableCell>
                            <TableCell className="text-right tabular-nums">{carton.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(carton.createdDate)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="flex flex-col gap-3">
                {activity.map((entry) => (
                  <Card key={entry.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{entry.action}</span>
                      <span className="text-xs text-muted-foreground">{entry.actor}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        }
      />

      <RecordPackingDialog open={recordOpen} onOpenChange={setRecordOpen} packingOrder={order} />
    </div>
  );
}
