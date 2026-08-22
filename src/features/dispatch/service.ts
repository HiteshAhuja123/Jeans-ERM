import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { generateDispatchOrderNumber } from "@/lib/dispatch-utils";
import { finishedGoodsService } from "@/features/inventory/finished-goods-service";
import { mockDispatchOrders } from "@/mock-data";
import type { DispatchLineItem, DispatchOrder, DispatchOrderStatus, Order } from "@/types";

export const dispatchOrderService = createMasterDataService<DispatchOrder>(mockDispatchOrders, "disp");
export const dispatchOrderHooks = createMasterDataHooks("dispatch-orders", dispatchOrderService);

// ---------------------------------------------------------------------------
// Create Dispatch
// ---------------------------------------------------------------------------

export interface CreateDispatchLineInput {
  productionOrderId: string;
  productionOrderNumber: string;
  styleId: string;
  styleCode: string;
  styleName: string;
  colorId: string;
  colorName: string;
  skuId?: string;
  quantity: number;
  unit: string;
}

export interface CreateDispatchOrderInput {
  order: Order;
  lines: CreateDispatchLineInput[];
  dispatchDate: string;
  carrier?: string;
  trackingRef?: string;
  notes?: string;
  recordedBy: string;
}

async function createDispatchOrder(input: CreateDispatchOrderInput) {
  const existing = await dispatchOrderService.list();
  const dispatchOrderNumber = generateDispatchOrderNumber(existing);
  const lineItems: DispatchLineItem[] = input.lines.map((line, i) => ({ id: `disp-line-${dispatchOrderNumber}-${i + 1}`, ...line }));
  const quantity = lineItems.reduce((sum, li) => sum + li.quantity, 0);

  const created = await dispatchOrderService.create({
    dispatchOrderNumber,
    orderId: input.order.id,
    orderNumber: input.order.orderNumber,
    customerId: input.order.customerId,
    customerName: input.order.customerName,
    lineItems,
    quantity,
    unit: lineItems[0]?.unit ?? "pcs",
    status: "dispatched",
    carrier: input.carrier || undefined,
    trackingRef: input.trackingRef || undefined,
    dispatchDate: input.dispatchDate,
    notes: input.notes,
    recordedBy: input.recordedBy,
    createdDate: new Date().toISOString().slice(0, 10),
  });

  for (const line of lineItems) {
    await finishedGoodsService.issueToDispatch({
      productionOrderId: line.productionOrderId,
      styleCode: line.styleCode,
      colorName: line.colorName,
      quantity: line.quantity,
      unit: line.unit,
      reference: dispatchOrderNumber,
      performedBy: input.recordedBy,
    });
  }

  return created;
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

async function updateDispatchOrderStatus({ dispatchOrder, status }: { dispatchOrder: DispatchOrder; status: DispatchOrderStatus }) {
  const patch: Partial<Omit<DispatchOrder, "id">> = { status };
  if (status === "delivered" && !dispatchOrder.deliveredDate) patch.deliveredDate = new Date().toISOString().slice(0, 10);
  return dispatchOrderService.update(dispatchOrder.id, patch);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const dispatchOrderActionHooks = {
  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: createDispatchOrder,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["dispatch-orders"] });
        queryClient.invalidateQueries({ queryKey: ["finished-goods-balances"] });
        queryClient.invalidateQueries({ queryKey: ["finished-goods-movements"] });
      },
    });
  },
  useUpdateStatus: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: updateDispatchOrderStatus, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dispatch-orders"] }) });
  },
};
