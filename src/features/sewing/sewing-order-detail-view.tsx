"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, PackageX, Plus } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatPercent } from "@/lib/format";
import { bundleStatusMeta, sewingOrderStatusMeta, sewingReworkStatusMeta, orderPriorityMeta } from "@/lib/status";
import {
  getAchievementPercent,
  getAssignableBundles,
  getBundleProcessedQuantity,
  getBundleRemainingQuantity,
  getRejectionPercent,
  getReworkPercent,
  getSewingOrderEditTier,
  getSewingOrderQuantitySummary,
  isReadyForProcessing,
} from "@/lib/sewing-utils";
import { AssignSewingOrderDialog } from "@/features/sewing/assign-sewing-order-dialog";
import { RecordProductionDialog } from "@/features/sewing/record-production-dialog";
import { ReworkCompleteDialog } from "@/features/sewing/rework-complete-dialog";
import { SewingOrderHoldControls } from "@/features/sewing/hold-controls";
import { SewingOrderStatusMenu } from "@/features/sewing/sewing-order-status-menu";
import { StartSewingButton } from "@/features/sewing/start-sewing-button";
import {
  sewingDefectHooks,
  sewingOrderBundleHooks,
  sewingOrderHooks,
  sewingProductionEntryHooks,
  sewingReworkHooks,
} from "@/features/sewing/service";
import { bundleHooks } from "@/features/cutting/bundle-service";
import { productionLineHooks } from "@/features/production-lines/service";
import { buildSewingOrderActivity } from "@/mock-data/sewing-activity";
import { mockSewingDefectReasons } from "@/mock-data";
import type { Bundle, SewingRework } from "@/types";

export function SewingOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = sewingOrderHooks.useDetail(id);
  const { data: links = [] } = sewingOrderBundleHooks.useBySewingOrder(id);
  const { data: allBundles = [] } = bundleHooks.useList();
  const { data: entries = [] } = sewingProductionEntryHooks.useBySewingOrder(id);
  const { data: defects = [] } = sewingDefectHooks.useBySewingOrder(id);
  const { data: reworks = [] } = sewingReworkHooks.useBySewingOrder(id);
  const { data: lines = [] } = productionLineHooks.useList();

  const [assignOpen, setAssignOpen] = useState(false);
  const [recordFor, setRecordFor] = useState<Bundle | null>(null);
  const [reworkToComplete, setReworkToComplete] = useState<SewingRework | null>(null);

  const orderBundles = useMemo(() => {
    const ids = new Set(links.map((l) => l.bundleId));
    return allBundles.filter((b) => ids.has(b.id));
  }, [allBundles, links]);

  const assignableBundles = useMemo(
    () => (order ? getAssignableBundles(order.productionOrderId, allBundles) : []),
    [order, allBundles],
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

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Sewing order not found"
        description="This sewing order may have been removed."
        action={{ label: "Back to Sewing Orders", onClick: () => router.push("/sewing/orders") }}
      />
    );
  }

  const statusMeta = sewingOrderStatusMeta[order.status];
  const priorityMeta = orderPriorityMeta[order.priority];
  const summary = getSewingOrderQuantitySummary(order, entries, reworks);
  const achievement = getAchievementPercent(summary.goodOutput, order.quantity);
  const rejectionPct = getRejectionPercent(summary.rejected, summary.input);
  const reworkPct = getReworkPercent(summary.totalRework, summary.input);
  const editTier = getSewingOrderEditTier(order.status);
  const canEdit = editTier !== "readonly";
  const canAssign = canEdit && assignableBundles.length > 0;
  const readyForProcessing = isReadyForProcessing(summary);
  const activity = buildSewingOrderActivity(order, links, entries, reworks);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/sewing/orders"
        backLabel="Back to Sewing Orders"
        title={order.sewingOrderNumber}
        subtitle={`${order.productionOrderNumber} · ${order.styleCode} · ${order.colorName} · ${order.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            {canAssign && (
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                Assign to Line
              </Button>
            )}
            <StartSewingButton sewingOrder={order} />
            <SewingOrderHoldControls sewingOrder={order} />
            <SewingOrderStatusMenu sewingOrder={order} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bundles">Bundles</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="defects">Defects</TabsTrigger>
              <TabsTrigger value="rework">Rework</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <span className="text-sm font-semibold text-foreground">Sewing Progress</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                  {[
                    { label: "Assigned", value: order.quantity },
                    { label: "Started (Input)", value: summary.input },
                    { label: "Good Output", value: summary.goodOutput },
                    { label: "Rejected", value: summary.rejected },
                    { label: "Rework", value: summary.pendingRework },
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
                <LabeledProgress
                  label="Good Output vs. Assigned"
                  current={summary.goodOutput}
                  total={order.quantity}
                  level={summary.goodOutput >= order.quantity ? "success" : "info"}
                />
              </Card>

              {readyForProcessing && (
                <p className="rounded-lg border border-success/25 bg-success-subtle px-3 py-2 text-sm text-success">
                  Good output is available and rework is resolved — ready to move toward Washing/Processing (Phase 9).
                </p>
              )}
              {summary.pendingRework > 0 && (
                <p className="rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-sm text-warning">
                  {summary.pendingRework.toLocaleString()} pcs still in rework — this order can&apos;t be marked Completed until rework is resolved.
                </p>
              )}

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Production Order</span>
                  <button type="button" onClick={() => router.push(`/production/orders/${order.productionOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.productionOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer Order</span>
                  <button type="button" onClick={() => router.push(`/orders/${order.orderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.orderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Priority</span>
                  <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Style / Color</span>
                  <span className="text-sm font-medium text-foreground">{order.styleCode} · {order.colorName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Line</span>
                  <span className="text-sm font-medium text-foreground">{lines.find((l) => l.id === order.productionLineId)?.name ?? "Not assigned"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Supervisor</span>
                  <span className="text-sm font-medium text-foreground">{order.supervisor ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Planned Start / End</span>
                  <span className="text-sm font-medium text-foreground">
                    {order.plannedStart ? formatDate(order.plannedStart) : "—"} – {order.plannedEnd ? formatDate(order.plannedEnd) : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Actual Start / End</span>
                  <span className="text-sm font-medium text-foreground">
                    {order.actualStart ? formatDate(order.actualStart) : "—"} – {order.actualEnd ? formatDate(order.actualEnd) : "—"}
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

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Achievement %</span>
                  <span className="text-sm font-medium text-foreground">{formatPercent(achievement, 1)} <span className="text-xs font-normal text-muted-foreground">(good / assigned)</span></span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Rejection %</span>
                  <span className="text-sm font-medium text-foreground">{formatPercent(rejectionPct, 1)} <span className="text-xs font-normal text-muted-foreground">(rejected / input)</span></span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Rework %</span>
                  <span className="text-sm font-medium text-foreground">{formatPercent(reworkPct, 1)} <span className="text-xs font-normal text-muted-foreground">(rework / input)</span></span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Bundles</span>
                  <span className="text-sm font-medium text-foreground">{orderBundles.length}</span>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="bundles" className="mt-4 flex flex-col gap-4">
              <Card className="grid grid-cols-3 gap-4 p-5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Assigned Quantity</span>
                  <span className="text-sm font-semibold text-foreground">{order.quantity.toLocaleString()} pcs</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Completed Quantity</span>
                  <span className="text-sm font-semibold text-foreground">{summary.goodOutput.toLocaleString()} pcs</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Remaining Quantity</span>
                  <span className="text-sm font-semibold text-foreground">{summary.remaining.toLocaleString()} pcs</span>
                </div>
              </Card>

              {canAssign && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                    <Plus /> Assign More Bundles
                  </Button>
                </div>
              )}

              {orderBundles.length === 0 ? (
                <EmptyState icon={PackageX} title="No bundles assigned yet" description="Assign ready-for-sewing bundles to this order to get started." />
              ) : (
                orderBundles.map((bundle) => {
                  const processed = getBundleProcessedQuantity(bundle.id, entries);
                  const remaining = getBundleRemainingQuantity(bundle, entries);
                  const meta = bundleStatusMeta[bundle.status];
                  const canRecord = canEdit && (bundle.status === "in_sewing" || bundle.status === "assigned" || bundle.status === "partially_completed") && remaining > 0;
                  return (
                    <Card key={bundle.id} className="flex flex-col gap-3 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{bundle.bundleNumber}</span>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Size</span>
                          <span className="text-sm font-medium text-foreground">{bundle.items.map((i) => i.sizeCode).join(", ")}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Bundle Qty</span>
                          <span className="text-sm font-medium text-foreground">{bundle.quantity.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Processed</span>
                          <span className="text-sm font-medium text-foreground">{processed.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Remaining</span>
                          <span className="text-sm font-medium text-foreground">{remaining.toLocaleString()} pcs</span>
                        </div>
                      </div>
                      <LabeledProgress label="Processed vs. Bundle Qty" current={processed} total={bundle.quantity} compact level={processed >= bundle.quantity ? "success" : "info"} />
                      <div className="flex items-center gap-2 pt-1">
                        {canRecord && (
                          <Button size="sm" onClick={() => setRecordFor(bundle)}>
                            Record Production
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => router.push(`/cutting/bundles/${bundle.id}`)}>
                          View Bundle
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="production" className="mt-4">
              {entries.length === 0 ? (
                <EmptyState icon={FileText} title="No production recorded yet" description="Record output against an assigned bundle to see it here." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Bundle</TableHead>
                        <TableHead className="text-right">Input</TableHead>
                        <TableHead className="text-right">Good</TableHead>
                        <TableHead className="text-right">Rejected</TableHead>
                        <TableHead className="text-right">Rework</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...entries]
                        .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell className="font-medium text-foreground">{entry.bundleNumber}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.inputQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.goodQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.rejectedQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.reworkQuantity.toLocaleString()}</TableCell>
                            <TableCell>{entry.recordedBy}</TableCell>
                            <TableCell className="max-w-48 truncate text-muted-foreground">{entry.notes ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="defects" className="mt-4">
              {defects.length === 0 ? (
                <EmptyState icon={FileText} title="No defects recorded" description="Defects raised during production entries will show up here." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Bundle</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...defects]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((defect) => (
                          <TableRow key={defect.id}>
                            <TableCell>{formatDate(defect.date)}</TableCell>
                            <TableCell className="font-medium text-foreground">{orderBundles.find((b) => b.id === defect.bundleId)?.bundleNumber ?? defect.bundleId}</TableCell>
                            <TableCell>{mockSewingDefectReasons.find((r) => r.id === defect.reasonId)?.label ?? defect.reasonId}</TableCell>
                            <TableCell className="text-right tabular-nums">{defect.quantity.toLocaleString()}</TableCell>
                            <TableCell>{defect.recordedBy}</TableCell>
                            <TableCell className="max-w-48 truncate text-muted-foreground">{defect.notes ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rework" className="mt-4 flex flex-col gap-3">
              {reworks.length === 0 ? (
                <EmptyState icon={FileText} title="No rework raised" description="Rework created from production entries will show up here." />
              ) : (
                reworks.map((rework) => {
                  const meta = sewingReworkStatusMeta[rework.status];
                  const bundle = orderBundles.find((b) => b.id === rework.bundleId);
                  return (
                    <Card key={rework.id} className="flex flex-col gap-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{rework.reworkNumber}</span>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Bundle</span>
                          <span className="text-foreground">{bundle?.bundleNumber ?? rework.bundleId}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Quantity</span>
                          <span className="text-foreground">{rework.quantity.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Reason</span>
                          <span className="text-foreground">{mockSewingDefectReasons.find((r) => r.id === rework.reasonId)?.label ?? rework.reasonId}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Created</span>
                          <span className="text-foreground">{formatDate(rework.createdDate)}</span>
                        </div>
                      </div>
                      {rework.completedDate && (
                        <span className="text-xs text-muted-foreground">
                          Resolved {formatDate(rework.completedDate)} — {(rework.completedQuantity ?? 0).toLocaleString()} recovered, {(rework.rejectedQuantity ?? 0).toLocaleString()} rejected
                        </span>
                      )}
                      {(rework.status === "pending" || rework.status === "in_progress") && (
                        <div className="pt-1">
                          <Button size="sm" onClick={() => setReworkToComplete(rework)}>
                            Complete Rework
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })
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

            <TabsContent value="documents" className="mt-4">
              <EmptyState icon={FileText} title="No documents yet" description="Document management for sewing orders is planned for a future phase." />
            </TabsContent>
          </Tabs>
        }
      />

      <AssignSewingOrderDialog open={assignOpen} onOpenChange={setAssignOpen} sewingOrder={order} />
      {recordFor && (
        <RecordProductionDialog open={Boolean(recordFor)} onOpenChange={(open) => !open && setRecordFor(null)} sewingOrder={order} bundle={recordFor} />
      )}
      {reworkToComplete && (
        <ReworkCompleteDialog
          open={Boolean(reworkToComplete)}
          onOpenChange={(open) => !open && setReworkToComplete(null)}
          sewingOrder={order}
          rework={reworkToComplete}
        />
      )}
    </div>
  );
}
