"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, PackageX } from "lucide-react";

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
import { qcOrderStatusMeta, qcReworkStatusMeta } from "@/lib/status";
import { getQcQuantitySummary } from "@/lib/post-sewing-utils";
import { getAchievementPercent, getRejectionPercent } from "@/lib/sewing-utils";
import { RecordInspectionDialog } from "@/features/quality/record-inspection-dialog";
import { QcReworkCompleteDialog } from "@/features/quality/qc-rework-complete-dialog";
import { StartQcButton } from "@/features/quality/start-qc-button";
import { QcOrderHoldControls } from "@/features/quality/hold-controls";
import { QcOrderStatusMenu } from "@/features/quality/qc-order-status-menu";
import { qcInspectionEntryHooks, qcOrderHooks, qcReworkHooks } from "@/features/quality/service";
import { mockQcDefectReasons } from "@/mock-data";
import { buildQcOrderActivity } from "@/mock-data/qc-activity";
import type { QcRework } from "@/types";

export function QcOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = qcOrderHooks.useDetail(id);
  const { data: entries = [] } = qcInspectionEntryHooks.useByQcOrder(id);
  const { data: reworks = [] } = qcReworkHooks.useByQcOrder(id);
  const [recordOpen, setRecordOpen] = useState(false);
  const [reworkToComplete, setReworkToComplete] = useState<QcRework | null>(null);

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
        title="QC order not found"
        description="This QC order may have been removed."
        action={{ label: "Back to Quality", onClick: () => router.push("/quality") }}
      />
    );
  }

  const statusMeta = qcOrderStatusMeta[order.status];
  const summary = getQcQuantitySummary(order, entries, reworks);
  const achievement = getAchievementPercent(summary.passed, order.quantity);
  const rejectionPct = getRejectionPercent(summary.rejected, summary.inspected);
  const activity = buildQcOrderActivity(order, entries, reworks);
  const canRecord = (order.status === "in_progress" || order.status === "partially_completed") && summary.remaining > 0;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/quality"
        backLabel="Back to Quality"
        title={order.qcOrderNumber}
        subtitle={`${order.finishingOrderNumber} · ${order.styleCode} · ${order.colorName} · ${order.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            <StartQcButton qcOrder={order} />
            {canRecord && <Button onClick={() => setRecordOpen(true)}>Record Inspection</Button>}
            <QcOrderHoldControls qcOrder={order} />
            <QcOrderStatusMenu qcOrder={order} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="rework">Rework</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <span className="text-sm font-semibold text-foreground">QC Progress</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                  {[
                    { label: "Planned", value: order.quantity },
                    { label: "Inspected", value: summary.inspected },
                    { label: "Passed", value: summary.passed },
                    { label: "Rework", value: summary.pendingRework },
                    { label: "Rejected", value: summary.rejected },
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
                <LabeledProgress label="Passed vs. Planned" current={summary.passed} total={order.quantity} level={summary.passed >= order.quantity ? "success" : "info"} />
              </Card>

              {order.status === "approved" && (
                <p className="rounded-lg border border-success/25 bg-success-subtle px-3 py-2 text-sm text-success">
                  Approved — every inspected piece has passed or been rejected, and no rework is pending. Ready for Packing.
                </p>
              )}
              {summary.pendingRework > 0 && (
                <p className="rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-sm text-warning">
                  {summary.pendingRework.toLocaleString()} pcs still in rework — this order can&apos;t be approved until rework is resolved.
                </p>
              )}

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Finishing Order</span>
                  <button type="button" onClick={() => router.push(`/finishing/${order.finishingOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.finishingOrderNumber}
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
                  <span className="text-xs text-muted-foreground">Inspector</span>
                  <span className="text-sm font-medium text-foreground">{order.inspector ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Achievement %</span>
                  <span className="text-sm font-medium text-foreground">{formatPercent(achievement, 1)} <span className="text-xs font-normal text-muted-foreground">(passed / planned)</span></span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Rejection %</span>
                  <span className="text-sm font-medium text-foreground">{formatPercent(rejectionPct, 1)} <span className="text-xs font-normal text-muted-foreground">(rejected / inspected)</span></span>
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
            </TabsContent>

            <TabsContent value="inspections" className="mt-4">
              {entries.length === 0 ? (
                <EmptyState icon={FileText} title="No inspections recorded yet" description="Record an inspection to see it here." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Inspected</TableHead>
                        <TableHead className="text-right">Passed</TableHead>
                        <TableHead className="text-right">Rework</TableHead>
                        <TableHead className="text-right">Rejected</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Inspector</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...entries]
                        .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.inspectedQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.passedQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.reworkQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.rejectedQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-muted-foreground">{mockQcDefectReasons.find((r) => r.id === entry.defectReasonId)?.label ?? "—"}</TableCell>
                            <TableCell>{entry.inspector}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rework" className="mt-4 flex flex-col gap-3">
              {reworks.length === 0 ? (
                <EmptyState icon={FileText} title="No rework raised" description="Rework created from inspection entries will show up here." />
              ) : (
                reworks.map((rework) => {
                  const meta = qcReworkStatusMeta[rework.status];
                  return (
                    <Card key={rework.id} className="flex flex-col gap-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{rework.reworkNumber}</span>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Quantity</span>
                          <span className="text-foreground">{rework.quantity.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Reason</span>
                          <span className="text-foreground">{mockQcDefectReasons.find((r) => r.id === rework.reasonId)?.label ?? rework.reasonId}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Created</span>
                          <span className="text-foreground">{formatDate(rework.createdDate)}</span>
                        </div>
                      </div>
                      {rework.completedDate && (
                        <span className="text-xs text-muted-foreground">
                          Resolved {formatDate(rework.completedDate)} — {(rework.completedQuantity ?? 0).toLocaleString()} passed, {(rework.rejectedQuantity ?? 0).toLocaleString()} rejected
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
          </Tabs>
        }
      />

      <RecordInspectionDialog open={recordOpen} onOpenChange={setRecordOpen} qcOrder={order} />
      {reworkToComplete && (
        <QcReworkCompleteDialog
          open={Boolean(reworkToComplete)}
          onOpenChange={(open) => !open && setReworkToComplete(null)}
          qcOrder={order}
          rework={reworkToComplete}
        />
      )}
    </div>
  );
}
