import type {
  Bundle,
  CuttingBatch,
  CuttingOrder,
  CuttingOutput,
  FabricAllocation,
  FabricIssue,
  MaterialReturn,
} from "@/types";

export interface CuttingActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

/**
 * Built from the actual Cutting Order / Batch / Output / Bundle / Fabric records rather than a
 * synthetic script — every entry traces back to a real record's own timestamp, so the timeline
 * stays correct as new fabric issues, output entries and bundles are recorded.
 */
export function buildCuttingOrderActivity(
  order: CuttingOrder,
  allocations: FabricAllocation[],
  issues: FabricIssue[],
  batches: CuttingBatch[],
  outputs: CuttingOutput[],
  bundles: Bundle[],
  returns: MaterialReturn[],
): CuttingActivityEntry[] {
  const entries: CuttingActivityEntry[] = [];
  const orderBatches = batches.filter((b) => b.cuttingOrderId === order.id);
  const batchIds = new Set(orderBatches.map((b) => b.id));

  entries.push({ id: `${order.id}-created`, actor: "Anjali Mehta", action: `Cutting order created for ${order.productionOrderNumber}`, timestamp: order.createdDate });

  for (const allocation of allocations.filter((a) => a.cuttingOrderId === order.id)) {
    entries.push({
      id: `${order.id}-alloc-${allocation.id}`,
      actor: "Anjali Mehta",
      action: `Fabric allocated — ${allocation.quantity.toLocaleString()} ${allocation.unit} of ${allocation.materialName}`,
      timestamp: allocation.date,
    });
  }

  for (const issue of issues.filter((i) => i.cuttingOrderId === order.id)) {
    entries.push({
      id: `${order.id}-issue-${issue.id}`,
      actor: issue.issuedBy,
      action: `Fabric issued to cutting — ${issue.quantity.toLocaleString()} ${issue.unit}`,
      timestamp: issue.issuedDate,
    });
  }

  if (order.actualStart) {
    entries.push({ id: `${order.id}-started`, actor: order.supervisor ?? "Deepak Patil", action: "Cutting started", timestamp: order.actualStart });
  }

  if (order.status === "on_hold" && order.holdReason) {
    entries.push({ id: `${order.id}-hold`, actor: order.supervisor ?? "Deepak Patil", action: `Cutting order put on hold — ${order.holdReason}`, timestamp: order.actualStart ?? order.createdDate });
  }

  for (const batch of orderBatches) {
    entries.push({
      id: `${order.id}-batch-${batch.id}`,
      actor: batch.supervisor ?? "Deepak Patil",
      action: `Cutting batch ${batch.batchNumber} created — ${batch.plannedQuantity.toLocaleString()} pcs planned`,
      timestamp: batch.createdDate,
    });
    if (batch.actualEnd) {
      entries.push({
        id: `${order.id}-batch-${batch.id}-done`,
        actor: batch.supervisor ?? "Deepak Patil",
        action: `Cutting batch ${batch.batchNumber} completed`,
        timestamp: batch.actualEnd,
      });
    }
  }

  for (const output of outputs.filter((o) => o.cuttingOrderId === order.id)) {
    const batch = orderBatches.find((b) => b.id === output.cuttingBatchId);
    entries.push({
      id: `${order.id}-output-${output.id}`,
      actor: output.recordedBy,
      action: `Output recorded for ${batch?.batchNumber ?? output.cuttingBatchId} — ${output.cutQuantity.toLocaleString()} cut, ${output.rejectedQuantity.toLocaleString()} rejected`,
      timestamp: output.recordedDate,
    });
  }

  const bundleGroups = new Map<string, { batchId: string; date: string; count: number; qty: number; actor: string }>();
  for (const bundle of bundles.filter((b) => batchIds.has(b.cuttingBatchId))) {
    const key = `${bundle.cuttingBatchId}-${bundle.createdDate}`;
    const group = bundleGroups.get(key) ?? { batchId: bundle.cuttingBatchId, date: bundle.createdDate, count: 0, qty: 0, actor: bundle.createdBy };
    group.count += 1;
    group.qty += bundle.quantity;
    bundleGroups.set(key, group);
  }
  for (const [key, group] of bundleGroups) {
    const batch = orderBatches.find((b) => b.id === group.batchId);
    entries.push({
      id: `${order.id}-bundles-${key}`,
      actor: group.actor,
      action: `${group.count} bundle${group.count === 1 ? "" : "s"} generated for ${batch?.batchNumber ?? group.batchId} — ${group.qty.toLocaleString()} pcs`,
      timestamp: group.date,
    });
  }

  const verifiedGroups = new Map<string, { date: string; count: number; actor: string }>();
  for (const bundle of bundles.filter((b) => batchIds.has(b.cuttingBatchId) && b.verifiedDate)) {
    const key = bundle.verifiedDate as string;
    const group = verifiedGroups.get(key) ?? { date: key, count: 0, actor: bundle.verifiedBy ?? "Deepak Patil" };
    group.count += 1;
    verifiedGroups.set(key, group);
  }
  for (const [key, group] of verifiedGroups) {
    entries.push({
      id: `${order.id}-verified-${key}`,
      actor: group.actor,
      action: `${group.count} bundle${group.count === 1 ? "" : "s"} verified — ready for sewing`,
      timestamp: group.date,
    });
  }

  for (const materialReturn of returns.filter((r) => r.cuttingOrderId === order.id)) {
    entries.push({
      id: `${order.id}-return-${materialReturn.id}`,
      actor: materialReturn.returnedBy,
      action: `Fabric returned to inventory — ${materialReturn.quantity.toLocaleString()} ${materialReturn.unit}`,
      timestamp: materialReturn.returnedDate,
    });
  }

  if (order.status === "completed" && order.actualEnd) {
    entries.push({ id: `${order.id}-completed`, actor: order.supervisor ?? "Deepak Patil", action: "Cutting order completed", timestamp: order.actualEnd });
  }

  if (order.status === "cancelled") {
    entries.push({ id: `${order.id}-cancelled`, actor: "Anjali Mehta", action: "Cutting order cancelled", timestamp: order.createdDate });
  }

  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
