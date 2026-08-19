import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { derivePoReceivingStatus } from "@/lib/purchasing-utils";
import { inventoryService } from "@/features/inventory/service";
import { mockGoodsReceipts, mockPurchaseOrders, mockPurchaseRequests } from "@/mock-data";
import type { GoodsReceipt, GoodsReceiptItem, PurchaseOrder, PurchaseRequest } from "@/types";

export const purchaseOrderService = createMasterDataService<PurchaseOrder>(mockPurchaseOrders, "po");
export const purchaseOrderHooks = createMasterDataHooks("purchase-orders", purchaseOrderService);

export const purchaseRequestService = createMasterDataService<PurchaseRequest>(mockPurchaseRequests, "pr");
export const purchaseRequestHooks = createMasterDataHooks("purchase-requests", purchaseRequestService);

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let receipts = [...mockGoodsReceipts];
let receiptCounter = receipts.length;

/** Goods Receipts are historical records — list/read/create only, never edited once recorded. */
export const goodsReceiptService = {
  list: () => delay([...receipts]),
  getById: (id: string) => delay(receipts.find((receipt) => receipt.id === id)),
  listByPo: (poId: string) => delay(receipts.filter((receipt) => receipt.poId === poId)),
  create: (input: Omit<GoodsReceipt, "id">) => {
    receiptCounter += 1;
    const receipt: GoodsReceipt = { ...input, id: `grn-${String(receiptCounter).padStart(3, "0")}` };
    receipts = [receipt, ...receipts];
    return delay(receipt);
  },
};

export interface ConfirmReceiptItemInput {
  poItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  inspectionStatus: GoodsReceiptItem["inspectionStatus"];
  warehouseId: string;
  locationId: string;
}

export interface ConfirmReceiptInput {
  po: PurchaseOrder;
  grnNumber: string;
  receivedDate: string;
  receivedBy: string;
  notes?: string;
  items: ConfirmReceiptItemInput[];
}

/**
 * One receiving confirmation touches three domains at once: it creates the Goods Receipt
 * record, increases inventory on-hand for whatever was accepted, and rolls the accepted
 * quantities up into the Purchase Order's item totals + derived status. Kept as one
 * orchestrated mutation so those three always stay in sync.
 */
async function confirmReceipt(input: ConfirmReceiptInput) {
  const grnItems: GoodsReceiptItem[] = input.items.map((item, index) => ({
    id: `${input.grnNumber}-item-${index + 1}`,
    ...item,
  }));

  const receipt = await goodsReceiptService.create({
    grnNumber: input.grnNumber,
    poId: input.po.id,
    poNumber: input.po.poNumber,
    supplierId: input.po.supplierId,
    supplierName: input.po.supplierName,
    receivedDate: input.receivedDate,
    receivedBy: input.receivedBy,
    notes: input.notes,
    items: grnItems,
  });

  for (const item of input.items) {
    if (item.acceptedQuantity <= 0) continue;
    await inventoryService.receiveStock({
      materialId: item.materialId,
      materialName: item.materialName,
      quantity: item.acceptedQuantity,
      unit: item.unit,
      warehouseId: item.warehouseId,
      locationId: item.locationId,
      reference: receipt.grnNumber,
      performedBy: input.receivedBy,
    });
  }

  const updatedItems = input.po.items.map((poItem) => {
    const received = input.items.find((item) => item.poItemId === poItem.id);
    if (!received) return poItem;
    return { ...poItem, receivedQuantity: poItem.receivedQuantity + received.acceptedQuantity };
  });

  const nextStatus = derivePoReceivingStatus({ items: updatedItems }) ?? input.po.status;
  const updatedPo = await purchaseOrderService.update(input.po.id, { items: updatedItems, status: nextStatus });

  return { receipt, purchaseOrder: updatedPo };
}

export const goodsReceiptHooks = {
  useList: () => useQuery({ queryKey: ["goods-receipts"], queryFn: goodsReceiptService.list }),
  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: ["goods-receipts", id],
      queryFn: () => goodsReceiptService.getById(id as string),
      enabled: Boolean(id),
    }),
  useByPo: (poId: string | undefined) =>
    useQuery({
      queryKey: ["goods-receipts", "po", poId],
      queryFn: () => goodsReceiptService.listByPo(poId as string),
      enabled: Boolean(poId),
    }),
  useConfirmReceipt: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: confirmReceipt,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
        queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      },
    });
  },
};
