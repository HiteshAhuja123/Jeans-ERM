import { z } from "zod";

export const createProcessingOrderSchema = z
  .object({
    sewingOrderId: z.string().min(1, "Select a sewing order"),
    processingTypeId: z.string().min(1, "Select a processing type"),
    quantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    maxQuantity: z.coerce.number(),
    mode: z.enum(["internal", "outsourced"]),
    vendorId: z.string().optional(),
    plannedStart: z.string().optional(),
    plannedEnd: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.quantity > data.maxQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Only ${data.maxQuantity.toLocaleString()} pieces are available from this sewing order`,
        path: ["quantity"],
      });
    }
    if (data.mode === "outsourced" && !data.vendorId) {
      ctx.addIssue({ code: "custom", message: "Select a vendor for outsourced processing", path: ["vendorId"] });
    }
    if (data.plannedStart && data.plannedEnd && data.plannedEnd < data.plannedStart) {
      ctx.addIssue({ code: "custom", message: "Planned end cannot be before the planned start.", path: ["plannedEnd"] });
    }
  });

export type CreateProcessingOrderValues = z.infer<typeof createProcessingOrderSchema>;

export const sendProcessingSchema = z
  .object({
    quantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    maxQuantity: z.coerce.number(),
    date: z.string().min(1, "Select a date"),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxQuantity <= 0) {
      ctx.addIssue({ code: "custom", message: "This order has already been fully sent.", path: ["quantity"] });
    } else if (data.quantity > data.maxQuantity) {
      ctx.addIssue({ code: "custom", message: `Only ${data.maxQuantity.toLocaleString()} pieces remain to send`, path: ["quantity"] });
    }
  });

export type SendProcessingValues = z.infer<typeof sendProcessingSchema>;

export const recordProcessingReceiptSchema = z
  .object({
    quantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    maxQuantity: z.coerce.number(),
    date: z.string().min(1, "Select a date"),
    issueNotes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxQuantity <= 0) {
      ctx.addIssue({ code: "custom", message: "There is nothing left to receive on this order.", path: ["quantity"] });
    } else if (data.quantity > data.maxQuantity) {
      ctx.addIssue({ code: "custom", message: `Only ${data.maxQuantity.toLocaleString()} pieces are available to receive`, path: ["quantity"] });
    }
  });

export type RecordProcessingReceiptValues = z.infer<typeof recordProcessingReceiptSchema>;

export const processingHoldReasonSchema = z.object({
  category: z.enum(["machine_issue", "vendor_delay", "material_issue", "quality_issue", "staff_shortage", "supervisor_decision", "other"]),
  details: z.string().trim().max(200).optional(),
});

export type ProcessingHoldReasonValues = z.infer<typeof processingHoldReasonSchema>;
