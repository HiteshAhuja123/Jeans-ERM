import { z } from "zod";

export const purchaseRequestFormSchema = z.object({
  materialId: z.string().min(1, "Select a material"),
  quantity: z.coerce.number().positive("Enter a quantity greater than 0"),
  requiredDate: z.string().min(1, "Enter a required date"),
  preferredSupplierId: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  reason: z.string().trim().min(1, "Enter a reason for this request").max(300),
  notes: z.string().max(500).optional(),
});

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestFormSchema>;

export const purchaseRequestFormDefaults: PurchaseRequestFormValues = {
  materialId: "",
  quantity: 0,
  requiredDate: "",
  preferredSupplierId: "",
  priority: "normal",
  reason: "",
  notes: "",
};

export const poItemFormSchema = z.object({
  id: z.string().min(1),
  materialId: z.string().min(1, "Select a material"),
  quantity: z.coerce.number().positive("Enter a quantity greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
});

export type PoItemFormValues = z.infer<typeof poItemFormSchema>;

export const purchaseOrderFormSchema = z
  .object({
    supplierId: z.string().min(1, "Select a supplier"),
    orderDate: z.string().min(1, "Order date is required"),
    expectedDate: z.string().min(1, "Enter an expected delivery date"),
    discount: z.coerce.number().min(0, "Discount cannot be negative"),
    tax: z.coerce.number().min(0, "Tax cannot be negative"),
    notes: z.string().max(500).optional(),
    items: z.array(poItemFormSchema).min(1, "Add at least one item"),
  })
  .superRefine((data, ctx) => {
    if (data.orderDate && data.expectedDate && data.expectedDate < data.orderDate) {
      ctx.addIssue({
        code: "custom",
        message: "Expected delivery date cannot be before the order date.",
        path: ["expectedDate"],
      });
    }
    const seenMaterials = new Set<string>();
    data.items.forEach((item, index) => {
      if (!item.materialId) return;
      if (seenMaterials.has(item.materialId)) {
        ctx.addIssue({ code: "custom", message: "This material is already on the order.", path: ["items", index, "materialId"] });
      }
      seenMaterials.add(item.materialId);
    });
  });

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export const poQuickEditSchema = z.object({
  expectedDate: z.string().min(1, "Enter an expected delivery date"),
  notes: z.string().max(500).optional(),
});

export type PoQuickEditValues = z.infer<typeof poQuickEditSchema>;
