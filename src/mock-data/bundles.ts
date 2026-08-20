import { mockCuttingBatches, mockCuttingOrders, mockCuttingPlans } from "@/mock-data/cutting";
import { mockSkus } from "@/mock-data/skus";
import type { Bundle, BundleStatus } from "@/types";

let bundleSeq = 820;

/**
 * Mechanically generates N same-size bundles for one Cutting Batch, in the spirit of the
 * "Automatic Bundle Generation" workflow (pick a batch, a size, a bundle size and a count).
 * Every seed field is resolved from the Cutting Order / Plan / Batch so a bundle always
 * carries full traceability back to the Production Order and Customer Order.
 */
function makeBundles(
  cuttingBatchId: string,
  sizeId: string,
  sizeCode: string,
  bundleSize: number,
  statuses: BundleStatus[],
  createdDate: string,
  createdBy: string,
): Bundle[] {
  const batch = mockCuttingBatches.find((b) => b.id === cuttingBatchId);
  if (!batch) throw new Error(`Unknown cutting batch "${cuttingBatchId}"`);
  const order = mockCuttingOrders.find((o) => o.id === batch.cuttingOrderId);
  if (!order) throw new Error(`Unknown cutting order for batch "${cuttingBatchId}"`);
  const plan = mockCuttingPlans.find((p) => p.cuttingOrderId === batch.cuttingOrderId);
  const sku = mockSkus.find((s) => s.styleId === batch.styleId && s.colorId === batch.colorId && s.sizeId === sizeId);

  return statuses.map((status) => {
    bundleSeq += 1;
    const verified = status !== "created" && status !== "pending_verification";
    return {
      id: `bnd-${bundleSeq}`,
      bundleNumber: `BND-2026-${String(bundleSeq).padStart(5, "0")}`,
      cuttingBatchId: batch.id,
      cuttingPlanId: plan?.id ?? "",
      cuttingOrderId: order.id,
      productionOrderId: order.productionOrderId,
      productionOrderNumber: order.productionOrderNumber,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      styleId: batch.styleId,
      styleCode: batch.styleCode,
      skuId: sku?.id,
      colorId: batch.colorId,
      colorName: batch.colorName,
      materialId: order.materialId,
      materialName: order.materialName,
      items: [{ id: `bnd-${bundleSeq}-item-1`, sizeId, sizeCode, quantity: bundleSize }],
      quantity: bundleSize,
      status,
      verifiedBy: verified ? "Deepak Patil" : undefined,
      verifiedDate: verified ? createdDate : undefined,
      createdBy,
      createdDate,
    };
  });
}

const rawBundles: Bundle[] = [
  // cut-127 / cb-127-1 (good 960 across 6 sizes) — bundled at 50/pc for sizes 32 & 34, rest still pending bundling.
  ...makeBundles("cb-127-1", "size-003", "32", 50, ["ready_for_sewing", "ready_for_sewing", "ready_for_sewing", "pending_verification"], "2026-08-07", "Deepak Patil"),
  ...makeBundles("cb-127-1", "size-004", "34", 50, ["ready_for_sewing", "ready_for_sewing", "pending_verification", "created"], "2026-08-07", "Deepak Patil"),

  // cut-128 / cb-128-1 (good 1450 across 6 sizes) — bundled at 100/pc for sizes 32 & 34.
  ...makeBundles("cb-128-1", "size-003", "32", 100, ["ready_for_sewing", "ready_for_sewing", "ready_for_sewing"], "2026-08-06", "Deepak Patil"),
  ...makeBundles("cb-128-1", "size-004", "34", 100, ["ready_for_sewing", "ready_for_sewing", "pending_verification"], "2026-08-06", "Deepak Patil"),

  // cut-121 / cb-121-1 (completed order, good 2920) — bundled at 100/pc for sizes 32 & 34, fully verified.
  ...makeBundles("cb-121-1", "size-003", "32", 100, Array(6).fill("completed") as BundleStatus[], "2026-08-09", "Deepak Patil"),
  ...makeBundles("cb-121-1", "size-004", "34", 100, Array(6).fill("completed") as BundleStatus[], "2026-08-09", "Deepak Patil"),

  // cut-122 / cb-122-1 (completed order, good 1840) — bundled at 50/pc for sizes 32 & 34.
  ...makeBundles("cb-122-1", "size-003", "32", 50, Array(8).fill("completed") as BundleStatus[], "2026-08-17", "Deepak Patil"),
  ...makeBundles("cb-122-1", "size-004", "34", 50, Array(8).fill("completed") as BundleStatus[], "2026-08-17", "Deepak Patil"),

  // cut-125 / cb-125-1 (completed order, good 2420) — bundled at 50/pc for sizes 32 & 34.
  ...makeBundles("cb-125-1", "size-003", "32", 50, [...Array(9).fill("completed"), "ready_for_sewing", "ready_for_sewing"] as BundleStatus[], "2026-08-13", "Deepak Patil"),
  ...makeBundles("cb-125-1", "size-004", "34", 50, Array(11).fill("completed") as BundleStatus[], "2026-08-13", "Deepak Patil"),
];

/**
 * Phase 8 overrides — bundles that have moved past "Ready for Sewing" through the sewing
 * workflow (assigned to a line, mid-sewing, or fully sewn) get their status advanced here rather
 * than in the Phase 7 generator above. See mock-data/sewing.ts for the Sewing Orders that drive
 * these transitions.
 */
const bundleStatusOverrides: Partial<Record<string, BundleStatus>> = {
  // SEW-2026-00103 (prod-125, partially completed) — 20 of 22 bundles fully sewn, 2 still assigned and waiting.
  "bnd-872": "assigned",
  "bnd-873": "assigned",
  // SEW-2026-00104 (prod-127, in progress) — one bundle fully sewn, one partially sewn, two assigned but not started.
  "bnd-821": "completed",
  "bnd-822": "in_sewing",
  "bnd-823": "assigned",
  "bnd-825": "assigned",
  // SEW-2026-00105 (prod-128, assigned, not yet started).
  "bnd-829": "assigned",
  "bnd-830": "assigned",
  "bnd-831": "assigned",
  "bnd-832": "assigned",
  "bnd-833": "assigned",
};

export const mockBundles: Bundle[] = rawBundles.map((bundle) => {
  const override = bundleStatusOverrides[bundle.id];
  return override ? { ...bundle, status: override } : bundle;
});
