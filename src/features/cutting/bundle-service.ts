import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { generateBundleNumber } from "@/lib/cutting-utils";
import { mockBundles } from "@/mock-data";
import type { Bundle, CuttingBatch, CuttingOrder } from "@/types";

export const bundleService = createMasterDataService<Bundle>(mockBundles, "bnd");
export const bundleHooks = createMasterDataHooks("bundles", bundleService);

export interface GenerateBundlesInput {
  cuttingBatch: CuttingBatch;
  cuttingPlanId: string;
  cuttingOrder: CuttingOrder;
  sizeId: string;
  sizeCode: string;
  skuId?: string;
  bundleSize: number;
  count: number;
  createdBy: string;
}

/**
 * Automatic Bundle Generation: given a batch, a size and a bundle size, mechanically stamps
 * out `count` same-size bundles with sequential, system-generated bundle numbers — never left
 * to the user to type. Each bundle carries the full traceability chain back to the Cutting
 * Order / Production Order / Customer Order.
 */
async function generateBundles(input: GenerateBundlesInput) {
  let existing = await bundleService.list();
  const created: Bundle[] = [];

  for (let i = 0; i < input.count; i += 1) {
    const bundleNumber = generateBundleNumber(existing);
    const bundle = await bundleService.create({
      bundleNumber,
      cuttingBatchId: input.cuttingBatch.id,
      cuttingPlanId: input.cuttingPlanId,
      cuttingOrderId: input.cuttingOrder.id,
      productionOrderId: input.cuttingOrder.productionOrderId,
      productionOrderNumber: input.cuttingOrder.productionOrderNumber,
      orderId: input.cuttingOrder.orderId,
      orderNumber: input.cuttingOrder.orderNumber,
      customerId: input.cuttingOrder.customerId,
      customerName: input.cuttingOrder.customerName,
      styleId: input.cuttingBatch.styleId,
      styleCode: input.cuttingBatch.styleCode,
      skuId: input.skuId,
      colorId: input.cuttingBatch.colorId,
      colorName: input.cuttingBatch.colorName,
      materialId: input.cuttingOrder.materialId,
      materialName: input.cuttingOrder.materialName,
      items: [{ id: `${bundleNumber}-item-1`, sizeId: input.sizeId, sizeCode: input.sizeCode, quantity: input.bundleSize }],
      quantity: input.bundleSize,
      status: "created",
      createdBy: input.createdBy,
      createdDate: new Date().toISOString().slice(0, 10),
    });
    created.push(bundle);
    existing = [...existing, bundle];
  }

  return created;
}

/** Verify checks style/color/size/quantity/traceability, then moves the bundle straight to Ready for Sewing. */
async function verifyBundle({ bundle, verifiedBy }: { bundle: Bundle; verifiedBy: string }) {
  return bundleService.update(bundle.id, {
    status: "ready_for_sewing",
    verifiedBy,
    verifiedDate: new Date().toISOString(),
  });
}

export const bundleActionHooks = {
  useGenerate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: generateBundles,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bundles"] }),
    });
  },
  useVerify: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: verifyBundle,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bundles"] }),
    });
  },
};
