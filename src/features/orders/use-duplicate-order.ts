"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { generateOrderNumber } from "@/lib/order-utils";
import { orderHooks } from "@/features/orders/service";
import type { Order } from "@/types";

/** Duplicate an order for a repeat customer — copies items and delivery details, not status or history. */
export function useDuplicateOrder() {
  const router = useRouter();
  const { data: existingOrders = [] } = orderHooks.useList();
  const createMutation = orderHooks.useCreate();

  async function duplicate(order: Order) {
    const orderNumber = generateOrderNumber(existingOrders);
    try {
      const created = await createMutation.mutateAsync({
        orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        customerReference: order.customerReference,
        orderDate: new Date().toISOString().slice(0, 10),
        dueDate: order.dueDate,
        priority: order.priority,
        status: "draft",
        lineItems: order.lineItems.map((item, index) => ({
          ...item,
          id: `${orderNumber}-li-${index + 1}`,
        })),
        quantity: order.quantity,
        quantityProduced: 0,
        currentStage: "cutting",
        isDelayed: false,
        deliveryLocation: order.deliveryLocation,
        shippingInstructions: order.shippingInstructions,
        notes: order.notes,
        internalNotes: undefined,
      });
      toast.success(`Order duplicated as ${created.orderNumber}`);
      router.push(`/orders/${created.id}/edit`);
    } catch {
      toast.error("Couldn't duplicate this order. Please try again.");
    }
  }

  return { duplicate, isDuplicating: createMutation.isPending };
}
