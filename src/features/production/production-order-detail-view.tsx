"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, FileText, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { ProductionStepper } from "@/components/shared/production-stepper";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import {
  cuttingOrderStatusMeta,
  defectSeverityMeta,
  finishingOrderStatusMeta,
  orderPriorityMeta,
  processingOrderStatusMeta,
  productionOrderStatusMeta,
  qcOrderStatusMeta,
  sewingOrderStatusMeta,
} from "@/lib/status";
import {
  buildProductionStageProgress,
  getDeliveryRisk,
  getLineCapacitySnapshot,
  getMaterialAvailability,
  getProductionOrderEditTier,
} from "@/lib/production-utils";
import {
  getBundledQuantity,
  getCuttingOrderCutQuantity,
  getCuttingOrderGoodOutput,
  getReadyForSewingQuantity,
} from "@/lib/cutting-utils";
import { getSewingOrderQuantitySummary } from "@/lib/sewing-utils";
import { getFinishingOrderQuantitySummary, getProcessingQuantitySummary, getQcQuantitySummary } from "@/lib/post-sewing-utils";
import { MaterialAvailabilityBadge, MaterialRequirementTable } from "@/features/production/material-requirement-table";
import { useMaterialRequirements } from "@/features/production/use-material-requirements";
import { ProductionOrderQuickEditSheet } from "@/features/production/production-order-quick-edit-sheet";
import { ProductionOrderStatusMenu } from "@/features/production/production-order-status-menu";
import { ReleaseProductionOrderButton } from "@/features/production/release-production-order-button";
import { productionOrderHooks } from "@/features/production/service";
import { bundleHooks } from "@/features/cutting/bundle-service";
import { cuttingBatchHooks, cuttingOrderHooks, cuttingOutputHooks } from "@/features/cutting/service";
import { sewingOrderHooks, sewingProductionEntryHooks, sewingReworkHooks } from "@/features/sewing/service";
import { processingOrderHooks, processingTransactionHooks } from "@/features/processing/service";
import { finishingEntryHooks, finishingOrderHooks } from "@/features/finishing/service";
import { qcInspectionEntryHooks, qcOrderHooks, qcReworkHooks } from "@/features/quality/service";
import { orderHooks } from "@/features/orders/service";
import { productionLineHooks } from "@/features/production-lines/service";
import { buildProductionOrderActivity } from "@/mock-data/production-activity";
import { mockDefects, mockQcInspections, mockSkus } from "@/mock-data";

export function ProductionOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: po, isLoading } = productionOrderHooks.useDetail(id);
  const { data: order } = orderHooks.useDetail(po?.orderId);
  const { data: lines = [] } = productionLineHooks.useList();
  const { data: cuttingOrders = [] } = cuttingOrderHooks.useList();
  const { data: cuttingBatches = [] } = cuttingBatchHooks.useList();
  const { data: cuttingOutputs = [] } = cuttingOutputHooks.useList();
  const { data: bundles = [] } = bundleHooks.useList();
  const { data: sewingOrders = [] } = sewingOrderHooks.useList();
  const { data: sewingEntries = [] } = sewingProductionEntryHooks.useList();
  const { data: sewingReworks = [] } = sewingReworkHooks.useList();
  const { data: processingOrders = [] } = processingOrderHooks.useList();
  const { data: processingTransactions = [] } = processingTransactionHooks.useList();
  const { data: finishingOrders = [] } = finishingOrderHooks.useList();
  const { data: finishingEntries = [] } = finishingEntryHooks.useList();
  const { data: qcOrders = [] } = qcOrderHooks.useList();
  const { data: qcEntries = [] } = qcInspectionEntryHooks.useList();
  const { data: qcReworks = [] } = qcReworkHooks.useList();
  const [editOpen, setEditOpen] = useState(false);

  const { lines: materialLines } = useMaterialRequirements(po?.styleId, po?.quantity ?? 0);

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
        title="Production order not found"
        description="This production order may have been removed."
        action={{ label: "Back to Production Orders", onClick: () => router.push("/production/orders") }}
      />
    );
  }

  const statusMeta = productionOrderStatusMeta[po.status];
  const priorityMeta = orderPriorityMeta[po.priority];
  const editTier = getProductionOrderEditTier(po.status);
  const line = lines.find((l) => l.id === po.productionLineId);
  const materialAvailability = getMaterialAvailability(materialLines);
  const capacitySnapshot = line ? getLineCapacitySnapshot(line, po.plannedStart, [po]) : undefined;
  const capacityOk = capacitySnapshot ? capacitySnapshot.planned <= capacitySnapshot.dailyCapacity : true;
  const deliveryRisk = order ? getDeliveryRisk(po, order) : undefined;
  const skus = mockSkus.filter((s) => s.styleId === po.styleId && s.colorId === po.colorId);
  const stages = buildProductionStageProgress(po);
  const activity = buildProductionOrderActivity(po);
  const inspections = order ? mockQcInspections.filter((i) => i.orderNumber === order.orderNumber) : [];
  const defects = order ? mockDefects.filter((d) => d.orderNumber === order.orderNumber) : [];
  const cuttingOrder = cuttingOrders.find((c) => c.productionOrderId === po.id);
  const cuttingCutQuantity = cuttingOrder ? getCuttingOrderCutQuantity(cuttingOrder.id, cuttingBatches, cuttingOutputs) : 0;
  const cuttingGoodOutput = cuttingOrder ? getCuttingOrderGoodOutput(cuttingOrder.id, cuttingBatches, cuttingOutputs) : 0;
  const cuttingBundledQuantity = cuttingOrder
    ? cuttingBatches.filter((b) => b.cuttingOrderId === cuttingOrder.id).reduce((sum, b) => sum + getBundledQuantity(b.id, bundles), 0)
    : 0;
  const cuttingReadyForSewing = cuttingOrder ? getReadyForSewingQuantity(cuttingOrder.id, cuttingBatches, bundles) : 0;
  const poSewingOrders = sewingOrders.filter((so) => so.productionOrderId === po.id);
  const poProcessingOrders = processingOrders.filter((p) => p.productionOrderId === po.id);
  const poFinishingOrders = finishingOrders.filter((f) => f.productionOrderId === po.id);
  const poQcOrders = qcOrders.filter((q) => q.productionOrderId === po.id);
  const canRelease = po.status === "draft" || po.status === "planned";

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/production/orders"
        backLabel="Back to Production Orders"
        title={po.productionOrderNumber}
        subtitle={`${po.styleCode} · ${po.colorName} · ${po.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        onEdit={editTier === "readonly" ? undefined : () => setEditOpen(true)}
        actions={
          <>
            {canRelease && (
              <ReleaseProductionOrderButton
                productionOrder={po}
                materialAvailability={materialAvailability}
                materialLines={materialLines}
                capacityOk={capacityOk}
              />
            )}
            <ProductionOrderStatusMenu productionOrder={po} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              {deliveryRisk?.atRisk && (
                <div className="flex items-center gap-2 rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-sm text-critical">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                  Delivery risk — planned completion is {Math.abs(deliveryRisk.bufferDays)} day
                  {Math.abs(deliveryRisk.bufferDays) === 1 ? "" : "s"} after the customer&apos;s delivery date.
                </div>
              )}

              <Card className="flex flex-col gap-3 p-5">
                <LabeledProgress
                  label="Production Progress"
                  current={po.quantityProduced}
                  total={po.quantity}
                  level={deliveryRisk?.atRisk ? "critical" : "info"}
                />
              </Card>

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{po.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer Order</span>
                  <button
                    type="button"
                    onClick={() => router.push(`/orders/${po.orderId}`)}
                    className="w-fit text-left text-sm font-medium text-primary hover:underline"
                  >
                    {po.orderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Priority</span>
                  <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Style / Color</span>
                  <span className="text-sm font-medium text-foreground">
                    {po.styleCode} · {po.colorName}
                  </span>
                </div>
                {skus.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">SKUs</span>
                    <span className="text-sm font-medium text-foreground">{skus.map((s) => s.skuCode).join(", ")}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Planned Start / End</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(po.plannedStart)} – {formatDate(po.plannedEnd)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Production Line</span>
                  <span className="text-sm font-medium text-foreground">{line?.name ?? "Unassigned"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Supervisor</span>
                  <span className="text-sm font-medium text-foreground">{po.supervisor ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Material Status</span>
                  <MaterialAvailabilityBadge availability={materialAvailability} />
                </div>
                {order && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Delivery Date</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(order.dueDate)}</span>
                  </div>
                )}
                {po.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{po.notes}</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Material Requirement</span>
                <MaterialAvailabilityBadge availability={materialAvailability} />
              </div>
              {materialLines.length === 0 ? (
                <EmptyState icon={PackageX} title="No BOM defined" description="Add a Bill of Materials to this style to calculate requirements." />
              ) : (
                <MaterialRequirementTable lines={materialLines} />
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-4 flex flex-col gap-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Planned Start</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(po.plannedStart)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Planned End</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(po.plannedEnd)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Production Line</span>
                  <span className="text-sm font-medium text-foreground">{line?.name ?? "Unassigned"}</span>
                </div>
              </Card>
              {capacitySnapshot && (
                <Card className="flex flex-col gap-3 p-5">
                  <span className="text-sm font-semibold text-foreground">Line Capacity on {formatDate(po.plannedStart)}</span>
                  <LabeledProgress
                    label={capacitySnapshot.lineName}
                    current={capacitySnapshot.planned}
                    total={capacitySnapshot.dailyCapacity}
                    valueLabel={`${capacitySnapshot.planned.toLocaleString()} / ${capacitySnapshot.dailyCapacity.toLocaleString()} pcs`}
                    level={capacitySnapshot.utilizationPercent > 100 ? "critical" : capacitySnapshot.utilizationPercent >= 90 ? "warning" : "info"}
                  />
                  {capacitySnapshot.utilizationPercent > 100 && (
                    <p className="flex items-center gap-1.5 text-xs text-critical">
                      <AlertTriangle className="size-3.5" aria-hidden="true" /> This line is over capacity on this date.
                    </p>
                  )}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="production" className="mt-4 flex flex-col gap-4">
              <Card className="overflow-x-auto p-5">
                <ProductionStepper stages={stages} />
              </Card>
              {cuttingOrder && (
                <Card className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Cutting</span>
                    <StatusBadge label={cuttingOrderStatusMeta[cuttingOrder.status].label} level={cuttingOrderStatusMeta[cuttingOrder.status].level} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                    {[
                      { label: "Planned", value: po.quantity },
                      { label: "Cut", value: cuttingCutQuantity },
                      { label: "Good Output", value: cuttingGoodOutput },
                      { label: "Bundled", value: cuttingBundledQuantity },
                      { label: "Ready for Sewing", value: cuttingReadyForSewing },
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
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push(`/cutting/orders/${cuttingOrder.id}`)}>
                    View Cutting Order
                  </Button>
                </Card>
              )}
              {poSewingOrders.length > 0 && (
                <Card className="flex flex-col gap-3 p-5">
                  <span className="text-sm font-semibold text-foreground">Sewing</span>
                  {poSewingOrders.map((so) => {
                    const summary = getSewingOrderQuantitySummary(so, sewingEntries, sewingReworks);
                    const meta = sewingOrderStatusMeta[so.status];
                    return (
                      <div key={so.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{so.sewingOrderNumber}</span>
                          <StatusBadge label={meta.label} level={meta.level} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                          {[
                            { label: "Assigned", value: so.quantity },
                            { label: "Input", value: summary.input },
                            { label: "Good", value: summary.goodOutput },
                            { label: "Rework", value: summary.pendingRework },
                            { label: "Rejected", value: summary.rejected },
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
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push(`/sewing/orders/${so.id}`)}>
                          View Sewing Order
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              )}
              {poProcessingOrders.length > 0 && (
                <Card className="flex flex-col gap-3 p-5">
                  <span className="text-sm font-semibold text-foreground">Processing</span>
                  {poProcessingOrders.map((proc) => {
                    const summary = getProcessingQuantitySummary(proc, processingTransactions);
                    const meta = processingOrderStatusMeta[proc.status];
                    return (
                      <div key={proc.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{proc.processingOrderNumber} · {proc.processingTypeName}</span>
                          <StatusBadge label={meta.label} level={meta.level} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                          {[
                            { label: "Planned", value: summary.planned },
                            { label: "Sent", value: summary.sent },
                            { label: "Received", value: summary.received },
                            { label: "Pending", value: summary.pending },
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
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push(`/processing/${proc.id}`)}>
                          View Processing Order
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              )}
              {poFinishingOrders.length > 0 && (
                <Card className="flex flex-col gap-3 p-5">
                  <span className="text-sm font-semibold text-foreground">Finishing</span>
                  {poFinishingOrders.map((fin) => {
                    const summary = getFinishingOrderQuantitySummary(fin, finishingEntries);
                    const meta = finishingOrderStatusMeta[fin.status];
                    return (
                      <div key={fin.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{fin.finishingOrderNumber}</span>
                          <StatusBadge label={meta.label} level={meta.level} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                          {[
                            { label: "Planned", value: summary.planned },
                            { label: "Output", value: summary.output },
                            { label: "Issues", value: summary.issue },
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
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push(`/finishing/${fin.id}`)}>
                          View Finishing Order
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              )}
              {poQcOrders.length > 0 && (
                <Card className="flex flex-col gap-3 p-5">
                  <span className="text-sm font-semibold text-foreground">Quality</span>
                  {poQcOrders.map((qc) => {
                    const summary = getQcQuantitySummary(qc, qcEntries, qcReworks);
                    const meta = qcOrderStatusMeta[qc.status];
                    return (
                      <div key={qc.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{qc.qcOrderNumber}</span>
                          <StatusBadge label={meta.label} level={meta.level} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                          {[
                            { label: "Planned", value: summary.planned },
                            { label: "Passed", value: summary.passed },
                            { label: "Rework", value: summary.pendingRework },
                            { label: "Rejected", value: summary.rejected },
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
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push(`/quality/${qc.id}`)}>
                          View QC Order
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              )}
              {po.currentStage === "packing" && poQcOrders.some((q) => q.status !== "cancelled") && poQcOrders.filter((q) => q.status !== "cancelled").every((q) => q.status === "approved") && (
                <p className="rounded-lg border border-success/25 bg-success-subtle px-3 py-2 text-sm text-success">
                  All QC orders for this production order are approved — Ready for Packing (Phase 10).
                </p>
              )}
            </TabsContent>

            <TabsContent value="quality" className="mt-4 flex flex-col gap-3">
              {inspections.length === 0 && defects.length === 0 ? (
                <EmptyState icon={FileText} title="No quality data yet" description="Inspections and defects logged against this order will appear here." />
              ) : (
                <>
                  {inspections.map((inspection) => (
                    <Card key={inspection.id} className="flex items-center justify-between p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Inspection · {inspection.stage}</span>
                        <span className="text-xs text-muted-foreground">
                          {inspection.passedQty.toLocaleString()} passed / {inspection.inspectedQty.toLocaleString()} inspected · {inspection.inspector}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{inspection.passRate}%</span>
                    </Card>
                  ))}
                  {defects.map((defect) => {
                    const meta = defectSeverityMeta[defect.severity];
                    return (
                      <Card key={defect.id} className="flex items-center justify-between p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{defect.defectType}</span>
                          <span className="text-xs text-muted-foreground">
                            {defect.quantity.toLocaleString()} pcs · {defect.stage} · {formatDate(defect.reportedDate)}
                          </span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} hideIcon />
                      </Card>
                    );
                  })}
                </>
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
              <EmptyState icon={FileText} title="Documents coming soon" description="Cutting tickets and production documents will appear here in a later phase." />
            </TabsContent>
          </Tabs>
        }
      />

      <ProductionOrderQuickEditSheet open={editOpen} onOpenChange={setEditOpen} productionOrder={po} />
    </div>
  );
}
