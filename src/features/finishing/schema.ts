import { z } from "zod";

export const createFinishingOrderSchema = z.object({
  processingOrderId: z.string().min(1, "Select a processing order"),
  quantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
  maxQuantity: z.coerce.number(),
  responsible: z.string().max(80).optional(),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  notes: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.quantity > data.maxQuantity) {
    ctx.addIssue({
      code: "custom",
      message: `Only ${data.maxQuantity.toLocaleString()} pieces are available from this processing order`,
      path: ["quantity"],
    });
  }
  if (data.plannedStart && data.plannedEnd && data.plannedEnd < data.plannedStart) {
    ctx.addIssue({ code: "custom", message: "Planned end cannot be before the planned start.", path: ["plannedEnd"] });
  }
});

export type CreateFinishingOrderValues = z.infer<typeof createFinishingOrderSchema>;

export const recordFinishingOutputSchema = z
  .object({
    date: z.string().min(1, "Select a date"),
    processedQuantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    outputQuantity: z.coerce.number().int().min(0),
    issueQuantity: z.coerce.number().int().min(0),
    maxProcessed: z.coerce.number(),
    issueReasonId: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxProcessed <= 0) {
      ctx.addIssue({ code: "custom", message: "This order has already been fully finished.", path: ["processedQuantity"] });
      return;
    }
    if (data.processedQuantity > data.maxProcessed) {
      ctx.addIssue({ code: "custom", message: `Only ${data.maxProcessed.toLocaleString()} pieces are available on this order`, path: ["processedQuantity"] });
    }
    const sum = data.outputQuantity + data.issueQuantity;
    if (sum !== data.processedQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Output + Issue must total the processed quantity (${data.processedQuantity.toLocaleString()}) — currently ${sum.toLocaleString()}`,
        path: ["outputQuantity"],
      });
    }
    if (data.issueQuantity > 0 && !data.issueReasonId) {
      ctx.addIssue({ code: "custom", message: "Select a reason for the flagged pieces", path: ["issueReasonId"] });
    }
  });

export type RecordFinishingOutputValues = z.infer<typeof recordFinishingOutputSchema>;

export const finishingHoldReasonSchema = z.object({
  category: z.enum(["machine_issue", "vendor_delay", "material_issue", "quality_issue", "staff_shortage", "supervisor_decision", "other"]),
  details: z.string().trim().max(200).optional(),
});

export type FinishingHoldReasonValues = z.infer<typeof finishingHoldReasonSchema>;
