import { z } from "zod";

export const orderLineItemSizeSchema = z.object({
  sizeId: z.string().min(1),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
});

export const orderLineItemFormSchema = z.object({
  id: z.string().min(1),
  styleId: z.string().min(1, "Select a style"),
  colorId: z.string().min(1, "Select a color"),
  sizeBreakdown: z.array(orderLineItemSizeSchema),
  notes: z.string().max(300).optional(),
});

export type OrderLineItemFormValues = z.infer<typeof orderLineItemFormSchema>;

export const orderFormSchema = z
  .object({
    customerId: z.string().min(1, "Select a customer"),
    orderNumber: z.string().min(1, "Order number is required"),
    orderDate: z.string().min(1, "Order date is required"),
    dueDate: z.string().min(1, "Enter a delivery date"),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    customerReference: z.string().max(60).optional(),
    notes: z.string().max(500).optional(),
    internalNotes: z.string().max(500).optional(),
    deliveryLocation: z.string().max(150).optional(),
    shippingInstructions: z.string().max(500).optional(),
    lineItems: z.array(orderLineItemFormSchema).min(1, "Add at least one style to the order"),
  })
  .superRefine((data, ctx) => {
    if (data.orderDate && data.dueDate && data.dueDate < data.orderDate) {
      ctx.addIssue({
        code: "custom",
        message: "Delivery date cannot be before the order date.",
        path: ["dueDate"],
      });
    }

    const seenCombos = new Set<string>();
    data.lineItems.forEach((item, index) => {
      if (item.styleId && item.colorId) {
        const combo = `${item.styleId}:${item.colorId}`;
        if (seenCombos.has(combo)) {
          ctx.addIssue({
            code: "custom",
            message: "This style and color are already on the order.",
            path: ["lineItems", index, "colorId"],
          });
        }
        seenCombos.add(combo);
      }

      const itemTotal = item.sizeBreakdown.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
      if (itemTotal <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a quantity greater than 0 for at least one size.",
          path: ["lineItems", index, "sizeBreakdown"],
        });
      }
    });
  });

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const orderQuickEditSchema = z
  .object({
    dueDate: z.string().min(1, "Enter a delivery date"),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    deliveryLocation: z.string().max(150).optional(),
    shippingInstructions: z.string().max(500).optional(),
    notes: z.string().max(500).optional(),
    internalNotes: z.string().max(500).optional(),
  })
  .refine((data) => Boolean(data.dueDate), { message: "Enter a delivery date", path: ["dueDate"] });

export type OrderQuickEditValues = z.infer<typeof orderQuickEditSchema>;
