"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Layers, PackageX, Plus, Scissors } from "lucide-react";

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
import {
  bundleStatusMeta,
  cuttingBatchStatusMeta,
  cuttingOrderStatusMeta,
  cuttingPlanStatusMeta,
  fabricAllocationStatusMeta,
  orderPriorityMeta,
} from "@/lib/status";
import {
  buildCuttingMatrix,
  getAvailableFabric,
  getAvailableForBundling,
  getBatchCutQuantity,
  getBatchFabricUsed,
  getBatchGoodOutput,
  getBatchRejectedQuantity,
  getBatchSizeBreakdown,
  getBundledQuantity,
  getCuttingEfficiency,
  getCuttingOrderCutQuantity,
  getCuttingOrderFabricUsed,
  getCuttingOrderGoodOutput,
  getCuttingOrderRejectedQuantity,
  getFabricReconciliation,
  getMaterialReadiness,
  getReadyForSewingQuantity,
  getRemainingCutQuantity,
  materialReadinessMeta,
} from "@/lib/cutting-utils";
import { CuttingOrderHoldControls, CuttingBatchHoldControls } from "@/features/cutting/hold-controls";
import { CuttingOrderQuickEditSheet } from "@/features/cutting/cutting-order-quick-edit-sheet";
import { CuttingOrderStatusMenu } from "@/features/cutting/cutting-order-status-menu";
import { GenerateBundlesDialog } from "@/features/cutting/generate-bundles-dialog";
import { IssueFabricDialog } from "@/features/cutting/issue-fabric-dialog";
import { NewBatchDialog } from "@/features/cutting/new-batch-dialog";
import { RecordOutputDialog } from "@/features/cutting/record-output-dialog";
import { ReturnMaterialDialog } from "@/features/cutting/return-material-dialog";
import { StartCuttingButton } from "@/features/cutting/start-cutting-button";
import { bundleHooks } from "@/features/cutting/bundle-service";
import {
  cuttingBatchHooks,
  cuttingOrderHooks,
  cuttingOutputHooks,
  cuttingPlanHooks,
  cuttingRejectionHooks,
  fabricAllocationHooks,
  fabricIssueHooks,
  materialReturnHooks,
} from "@/features/cutting/service";
import { inventoryHooks } from "@/features/inventory/service";
import { mockCuttingRejectionReasons, mockSizes } from "@/mock-data";
import { buildCuttingOrderActivity } from "@/mock-data/cutting-activity";
import type { Bundle, CuttingBatch } from "@/types";

const notStartedStatuses = ["pending", "material_check", "ready"] as const;

export function CuttingOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = cuttingOrderHooks.useDetail(id);
  const { data: plans = [] } = cuttingPlanHooks.useList();
  const { data: batches = [] } = cuttingBatchHooks.useList();
  const { data: outputs = [] } = cuttingOutputHooks.useList();
  const { data: bundles = [] } = bundleHooks.useList();
  const { data: allocations = [] } = fabricAllocationHooks.useByCuttingOrder(id);
  const { data: issues = [] } = fabricIssueHooks.useByCuttingOrder(id);
  const { data: returns = [] } = materialReturnHooks.useByCuttingOrder(id);
  const { data: rejections = [] } = cuttingRejectionHooks.useByCuttingOrder(id);
  const { data: balances = [] } = inventoryHooks.useList();

  const [editOpen, setEditOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [outputDialogBatch, setOutputDialogBatch] = useState<CuttingBatch | null>(null);
  const [bundleDialogBatch, setBundleDialogBatch] = useState<CuttingBatch | null>(null);

  const orderBatches = useMemo(() => batches.filter((b) => b.cuttingOrderId === id).sort((a, b) => a.createdDate.localeCompare(b.createdDate)), [batches, id]);
  const plan = plans.find((p) => p.cuttingOrderId === id);
  const orderBundles = useMemo(() => {
    const batchIds = new Set(orderBatches.map((b) => b.id));
    return bundles.filter((b) => batchIds.has(b.cuttingBatchId));
  }, [bundles, orderBatches]);
  const allocation = allocations[0];

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
        title="Cutting order not found"
        description="This cutting order may have been removed."
        action={{ label: "Back to Cutting Orders", onClick: () => router.push("/cutting/orders") }}
      />
    );
  }

  const statusMeta = cuttingOrderStatusMeta[order.status];
  const priorityMeta = orderPriorityMeta[order.priority];
  const cutQuantity = getCuttingOrderCutQuantity(order.id, batches, outputs);
  const rejectedQuantity = getCuttingOrderRejectedQuantity(order.id, batches, outputs);
  const goodOutput = getCuttingOrderGoodOutput(order.id, batches, outputs);
  const remainingToCut = getRemainingCutQuantity(order.requiredQuantity, cutQuantity);
  const bundledQuantity = orderBatches.reduce((sum, b) => sum + getBundledQuantity(b.id, bundles), 0);
  const readyForSewing = getReadyForSewingQuantity(order.id, batches, bundles);
  const efficiency = getCuttingEfficiency(order.requiredQuantity, goodOutput);

  const totalIssued = issues.reduce((sum, i) => sum + i.quantity, 0);
  const totalReturned = returns.reduce((sum, r) => sum + r.quantity, 0);
  const fabricUsed = getCuttingOrderFabricUsed(order.id, batches, outputs);
  const reconciliation = getFabricReconciliation(totalIssued, fabricUsed, totalReturned);
  const remainingToIssue = Math.max(0, order.fabricRequired - totalIssued);
  const remainingToReturn = Math.max(0, totalIssued - fabricUsed - totalReturned);

  const balance = balances.find((b) => b.materialId === order.materialId);
  const availableFabric = getAvailableFabric(balance);
  const readiness = getMaterialReadiness(order.fabricRequired, availableFabric);
  const readinessMeta = materialReadinessMeta[readiness];
  const notStarted = notStartedStatuses.includes(order.status as (typeof notStartedStatuses)[number]);

  const matrixEntries = orderBatches.flatMap((batch) =>
    getBatchSizeBreakdown(batch.id, outputs).map((line) => ({
      colorId: batch.colorId,
      colorName: batch.colorName,
      sizeId: line.sizeId,
      quantity: line.quantity,
    })),
  );
  const matrix = buildCuttingMatrix(matrixEntries);
  const sizeLookup = new Map(mockSizes.map((s) => [s.id, s.code]));

  const rejectionByReason = new Map<string, number>();
  for (const rejection of rejections) {
    rejectionByReason.set(rejection.reasonId, (rejectionByReason.get(rejection.reasonId) ?? 0) + rejection.quantity);
  }

  const activity = buildCuttingOrderActivity(order, allocations, issues, batches, outputs, bundles, returns);

  const canEdit = order.status !== "completed" && order.status !== "cancelled";
  const canAddBatch = canEdit && remainingToCut > 0;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/cutting/orders"
        backLabel="Back to Cutting Orders"
        title={order.cuttingOrderNumber}
        subtitle={`${order.productionOrderNumber} · ${order.styleCode} · ${order.colorName} · ${order.requiredQuantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        onEdit={canEdit ? () => setEditOpen(true) : undefined}
        actions={
          <>
            <StartCuttingButton cuttingOrder={order} />
            <CuttingOrderHoldControls cuttingOrder={order} />
            <CuttingOrderStatusMenu cuttingOrder={order} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="material">Material &amp; Fabric</TabsTrigger>
              <TabsTrigger value="batches">Cutting Batches</TabsTrigger>
              <TabsTrigger value="bundles">Bundles</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <span className="text-sm font-semibold text-foreground">Cutting Progress</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                  {[
                    { label: "Required", value: order.requiredQuantity },
                    { label: "Cut", value: cutQuantity },
                    { label: "Good Output", value: goodOutput },
                    { label: "Bundled", value: bundledQuantity },
                    { label: "Ready for Sewing", value: readyForSewing },
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
                  label="Cut vs. Required"
                  current={cutQuantity}
                  total={order.requiredQuantity}
                  level={cutQuantity >= order.requiredQuantity ? "success" : "info"}
                />
              </Card>

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
                  <span className="text-xs text-muted-foreground">Material</span>
                  <span className="text-sm font-medium text-foreground">{order.materialCode} — {order.materialName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Rejected</span>
                  <span className="text-sm font-medium text-foreground">{rejectedQuantity.toLocaleString()} pcs</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Remaining to Cut</span>
                  <span className="text-sm font-medium text-foreground">{remainingToCut.toLocaleString()} pcs</span>
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
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Cutting Supervisor</span>
                  <span className="text-sm font-medium text-foreground">{order.supervisor ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Cutting Efficiency</span>
                  <span className="text-sm font-medium text-foreground">{formatPercent(efficiency, 0)} <span className="text-xs font-normal text-muted-foreground">(good / required)</span></span>
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

              {matrix.rows.length > 0 && (
                <Card className="flex flex-col gap-3 overflow-x-auto p-5">
                  <span className="text-sm font-semibold text-foreground">Cut Output by Size</span>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Color</TableHead>
                        {matrix.sizeIds.map((sizeId) => (
                          <TableHead key={sizeId} className="text-right">{sizeLookup.get(sizeId) ?? sizeId}</TableHead>
                        ))}
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrix.rows.map((row) => (
                        <TableRow key={row.colorId}>
                          <TableCell className="font-medium text-foreground">{row.colorName}</TableCell>
                          {matrix.sizeIds.map((sizeId) => (
                            <TableCell key={sizeId} className="text-right tabular-nums">{(row.bySize[sizeId] ?? 0).toLocaleString()}</TableCell>
                          ))}
                          <TableCell className="text-right font-medium tabular-nums">{row.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-medium text-foreground">Total</TableCell>
                        {matrix.sizeIds.map((sizeId) => (
                          <TableCell key={sizeId} className="text-right font-medium tabular-nums">{(matrix.columnTotals[sizeId] ?? 0).toLocaleString()}</TableCell>
                        ))}
                        <TableCell className="text-right font-semibold tabular-nums">{matrix.grandTotal.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="material" className="mt-4 flex flex-col gap-4">
              {notStarted && (
                <Card className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Material Readiness Check</span>
                    <StatusBadge label={readinessMeta.label} level={readinessMeta.level} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Required</span>
                      <span className="text-sm font-medium text-foreground">{order.fabricRequired.toLocaleString()} {order.unit}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Available</span>
                      <span className="text-sm font-medium text-foreground">{availableFabric.toLocaleString()} {order.unit}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Issued</span>
                      <span className="text-sm font-medium text-foreground">{totalIssued.toLocaleString()} {order.unit}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Shortage</span>
                      <span className={`text-sm font-medium ${readiness === "shortage" ? "text-critical" : "text-foreground"}`}>
                        {Math.max(0, order.fabricRequired - availableFabric).toLocaleString()} {order.unit}
                      </span>
                    </div>
                  </div>
                  {readiness === "shortage" && (
                    <p className="flex items-center gap-1.5 rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-xs text-critical">
                      <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" /> Not enough {order.materialName} in the warehouse to fully allocate this order yet.
                    </p>
                  )}
                </Card>
              )}

              <Card className="flex flex-col gap-3 p-5">
                <span className="text-sm font-semibold text-foreground">Fabric Allocation</span>
                {!allocation ? (
                  <p className="text-sm text-muted-foreground">No fabric has been allocated to this cutting order yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Allocation</span>
                      <span className="text-sm font-medium text-foreground">{allocation.allocationNumber}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Quantity</span>
                      <span className="text-sm font-medium text-foreground">{allocation.quantity.toLocaleString()} {allocation.unit}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Date</span>
                      <span className="text-sm font-medium text-foreground">{formatDate(allocation.date)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <StatusBadge label={fabricAllocationStatusMeta[allocation.status].label} level={fabricAllocationStatusMeta[allocation.status].level} />
                    </div>
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Fabric Issued to Cutting</span>
                  {allocation && canEdit && remainingToIssue > 0 && (
                    <Button size="sm" onClick={() => setIssueDialogOpen(true)}>
                      Issue Fabric
                    </Button>
                  )}
                </div>
                {issues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fabric issued yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {issues.map((issue) => (
                      <div key={issue.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{formatDate(issue.issuedDate)} · {issue.issuedBy}</span>
                        <span className="font-medium tabular-nums text-foreground">{issue.quantity.toLocaleString()} {issue.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                {remainingToIssue > 0 && (
                  <p className="text-xs text-muted-foreground">{remainingToIssue.toLocaleString()} {order.unit} still to be issued against the allocation.</p>
                )}
              </Card>

              <Card className="flex flex-col gap-3 p-5">
                <span className="text-sm font-semibold text-foreground">Fabric Reconciliation</span>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Issued</span>
                    <span className="text-sm font-medium text-foreground">{reconciliation.issued.toLocaleString()} {order.unit}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Used</span>
                    <span className="text-sm font-medium text-foreground">{reconciliation.used.toLocaleString()} {order.unit}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Returned</span>
                    <span className="text-sm font-medium text-foreground">{reconciliation.returned.toLocaleString()} {order.unit}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Wastage</span>
                    <span className="text-sm font-medium text-foreground">{reconciliation.wastage.toLocaleString()} {order.unit} ({formatPercent(reconciliation.wastagePercent)})</span>
                  </div>
                </div>
                {reconciliation.unaccounted > 0 && (
                  <p className="flex items-center gap-1.5 rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-xs text-critical">
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" /> {reconciliation.unaccounted.toLocaleString()} {order.unit} unaccounted for — used + returned exceeds issued. Check the recorded quantities.
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {remainingToReturn > 0 ? (
                    <p className="text-xs text-muted-foreground">{remainingToReturn.toLocaleString()} {order.unit} currently unused and eligible for return.</p>
                  ) : (
                    <span />
                  )}
                  {canEdit && remainingToReturn > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setReturnDialogOpen(true)}>
                      Return Material
                    </Button>
                  )}
                </div>
                {returns.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border pt-3">
                    {returns.map((materialReturn) => (
                      <div key={materialReturn.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{formatDate(materialReturn.returnedDate)} · {materialReturn.returnedBy}</span>
                        <span className="font-medium tabular-nums text-foreground">{materialReturn.quantity.toLocaleString()} {materialReturn.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="batches" className="mt-4 flex flex-col gap-4">
              {plan && (
                <Card className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Cutting Plan — {plan.planNumber}</span>
                    <StatusBadge label={cuttingPlanStatusMeta[plan.status].label} level={cuttingPlanStatusMeta[plan.status].level} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Planned Quantity</span>
                      <span className="text-sm font-medium text-foreground">{plan.plannedQuantity.toLocaleString()} pcs</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Planned Fabric</span>
                      <span className="text-sm font-medium text-foreground">{plan.plannedFabric.toLocaleString()} {plan.unit}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Planned Wastage</span>
                      <span className="text-sm font-medium text-foreground">{formatPercent(plan.plannedWastagePercent)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Remaining to Plan</span>
                      <span className="text-sm font-medium text-foreground">{remainingToCut.toLocaleString()} pcs</span>
                    </div>
                  </div>
                </Card>
              )}

              {rejectionByReason.size > 0 && (
                <Card className="flex flex-col gap-2 p-5">
                  <span className="text-sm font-semibold text-foreground">Rejections by Reason</span>
                  {Array.from(rejectionByReason.entries()).map(([reasonId, quantity]) => (
                    <div key={reasonId} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{mockCuttingRejectionReasons.find((r) => r.id === reasonId)?.label ?? reasonId}</span>
                      <span className="font-medium tabular-nums text-foreground">{quantity.toLocaleString()} pcs</span>
                    </div>
                  ))}
                </Card>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Cutting Batches ({orderBatches.length})</span>
                {plan && canAddBatch && (
                  <Button size="sm" variant="outline" onClick={() => setNewBatchOpen(true)}>
                    <Plus /> New Batch
                  </Button>
                )}
              </div>

              {orderBatches.length === 0 ? (
                <EmptyState icon={Scissors} title="No cutting batches yet" description="Create the first cutting batch once material is ready." />
              ) : (
                orderBatches.map((batch) => {
                  const batchCut = getBatchCutQuantity(batch.id, outputs);
                  const batchRejected = getBatchRejectedQuantity(batch.id, outputs);
                  const batchGood = getBatchGoodOutput(batch.id, outputs);
                  const batchFabricUsed = getBatchFabricUsed(batch.id, outputs);
                  const batchStatusMeta = cuttingBatchStatusMeta[batch.status];
                  const availableToBundle = getAvailableForBundling(batch.id, outputs, bundles);
                  const canRecordOutput = canEdit && batch.status !== "cancelled" && batchCut < batch.plannedQuantity;

                  return (
                    <Card key={batch.id} className="flex flex-col gap-3 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{batch.batchNumber}</span>
                        <div className="flex items-center gap-2">
                          <StatusBadge label={batchStatusMeta.label} level={batchStatusMeta.level} />
                          <CuttingBatchHoldControls batch={batch} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Planned</span>
                          <span className="text-sm font-medium text-foreground">{batch.plannedQuantity.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Cut</span>
                          <span className="text-sm font-medium text-foreground">{batchCut.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Rejected</span>
                          <span className="text-sm font-medium text-foreground">{batchRejected.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Good Output</span>
                          <span className="text-sm font-medium text-foreground">{batchGood.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Fabric Used</span>
                          <span className="text-sm font-medium text-foreground">{batchFabricUsed.toLocaleString()} {order.unit}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Available to Bundle</span>
                          <span className="text-sm font-medium text-foreground">{availableToBundle.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Operator / Supervisor</span>
                          <span className="text-sm font-medium text-foreground">{batch.operator ?? "—"} / {batch.supervisor ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Start / End</span>
                          <span className="text-sm font-medium text-foreground">
                            {batch.actualStart ? formatDate(batch.actualStart) : "—"} – {batch.actualEnd ? formatDate(batch.actualEnd) : "—"}
                          </span>
                        </div>
                      </div>
                      {batch.holdReason && batch.status === "on_hold" && (
                        <p className="text-xs text-warning">On hold — {batch.holdReason}</p>
                      )}
                      <LabeledProgress label="Cut vs. Planned" current={batchCut} total={batch.plannedQuantity} compact level={batchCut >= batch.plannedQuantity ? "success" : "info"} />
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {canRecordOutput && (
                          <Button size="sm" onClick={() => setOutputDialogBatch(batch)}>
                            Record Output
                          </Button>
                        )}
                        {availableToBundle > 0 && (
                          <Button size="sm" variant="outline" onClick={() => setBundleDialogBatch(batch)}>
                            <Layers /> Generate Bundles
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="bundles" className="mt-4 flex flex-col gap-3">
              {orderBundles.length === 0 ? (
                <EmptyState icon={Layers} title="No bundles yet" description="Generate bundles from a completed cutting batch once good output is available." />
              ) : (
                <BundleListForOrder bundles={orderBundles} />
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

      <CuttingOrderQuickEditSheet open={editOpen} onOpenChange={setEditOpen} cuttingOrder={order} />
      {allocation && (
        <IssueFabricDialog
          open={issueDialogOpen}
          onOpenChange={setIssueDialogOpen}
          cuttingOrder={order}
          allocation={allocation}
          remaining={Math.max(0, allocation.quantity - totalIssued)}
        />
      )}
      <ReturnMaterialDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        cuttingOrder={order}
        allocation={allocation}
        maxReturnable={remainingToReturn}
      />
      {plan && (
        <NewBatchDialog
          open={newBatchOpen}
          onOpenChange={setNewBatchOpen}
          cuttingPlan={plan}
          cuttingOrder={order}
          maxPlannable={remainingToCut}
        />
      )}
      {outputDialogBatch && (
        <RecordOutputDialog
          open={Boolean(outputDialogBatch)}
          onOpenChange={(open) => !open && setOutputDialogBatch(null)}
          batch={outputDialogBatch}
          priorCutQuantity={getBatchCutQuantity(outputDialogBatch.id, outputs)}
          unit={order.unit}
        />
      )}
      {bundleDialogBatch && plan && (
        <GenerateBundlesDialog
          open={Boolean(bundleDialogBatch)}
          onOpenChange={(open) => !open && setBundleDialogBatch(null)}
          batch={bundleDialogBatch}
          cuttingPlanId={plan.id}
          cuttingOrder={order}
          outputs={outputs}
          bundles={bundles}
        />
      )}
    </div>
  );
}

function BundleListForOrder({ bundles }: { bundles: Bundle[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      {bundles.map((bundle) => {
        const meta = bundleStatusMeta[bundle.status];
        return (
          <Card
            key={bundle.id}
            className="flex cursor-pointer items-center justify-between gap-3 p-4"
            onClick={() => router.push(`/cutting/bundles/${bundle.id}`)}
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{bundle.bundleNumber}</span>
              <span className="text-xs text-muted-foreground">Size {bundle.items.map((i) => i.sizeCode).join(", ")} · {bundle.quantity.toLocaleString()} pcs</span>
            </div>
            <StatusBadge label={meta.label} level={meta.level} />
          </Card>
        );
      })}
    </div>
  );
}
