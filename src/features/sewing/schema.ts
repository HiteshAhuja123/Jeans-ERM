import { z } from "zod";

export const createSewingOrderSchema = z.object({
  productionOrderId: z.string().min(1, "Select a production order"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  notes: z.string().max(500).optional(),
});

export type CreateSewingOrderValues = z.infer<typeof createSewingOrderSchema>;

export const assignSewingOrderSchema = z
  .object({
    productionLineId: z.string().min(1, "Select a line"),
    supervisor: z.string().min(1, "Select a supervisor"),
    plannedStart: z.string().min(1, "Select a start date"),
    plannedEnd: z.string().min(1, "Select an end date"),
    bundleIds: z.array(z.string()).min(1, "Select at least one bundle to assign"),
  })
  .refine((data) => data.plannedEnd >= data.plannedStart, {
    message: "Planned end cannot be before the planned start.",
    path: ["plannedEnd"],
  });

export type AssignSewingOrderValues = z.infer<typeof assignSewingOrderSchema>;

export const recordSewingProductionSchema = z
  .object({
    date: z.string().min(1, "Select a date"),
    inputQuantity: z.coerce.number().int().positive("Enter an input quantity greater than 0"),
    goodQuantity: z.coerce.number().int().min(0),
    rejectedQuantity: z.coerce.number().int().min(0),
    reworkQuantity: z.coerce.number().int().min(0),
    maxInput: z.coerce.number(),
    reasonId: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxInput <= 0) {
      ctx.addIssue({ code: "custom", message: "This bundle has already been fully processed.", path: ["inputQuantity"] });
      return;
    }
    if (data.inputQuantity > data.maxInput) {
      ctx.addIssue({
        code: "custom",
        message: `Only ${data.maxInput.toLocaleString()} pieces are available on this bundle`,
        path: ["inputQuantity"],
      });
    }
    const sum = data.goodQuantity + data.rejectedQuantity + data.reworkQuantity;
    if (sum !== data.inputQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Good + Rejected + Rework must total the input quantity (${data.inputQuantity.toLocaleString()}) — currently ${sum.toLocaleString()}`,
        path: ["goodQuantity"],
      });
    }
    if (data.rejectedQuantity + data.reworkQuantity > 0 && !data.reasonId) {
      ctx.addIssue({ code: "custom", message: "Select a reason for the rejected/rework pieces", path: ["reasonId"] });
    }
  });

export type RecordSewingProductionValues = z.infer<typeof recordSewingProductionSchema>;

export const completeReworkSchema = z
  .object({
    completedQuantity: z.coerce.number().int().min(0),
    rejectedQuantity: z.coerce.number().int().min(0),
    totalQuantity: z.coerce.number().int(),
  })
  .superRefine((data, ctx) => {
    const sum = data.completedQuantity + data.rejectedQuantity;
    if (sum !== data.totalQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Recovered + Rejected must total the rework quantity (${data.totalQuantity.toLocaleString()}) — currently ${sum.toLocaleString()}`,
        path: ["completedQuantity"],
      });
    }
  });

export type CompleteReworkValues = z.infer<typeof completeReworkSchema>;

export const sewingHoldReasonSchema = z.object({
  category: z.enum(["machine_issue", "operator_shortage", "material_issue", "quality_issue", "supervisor_decision", "other"]),
  details: z.string().trim().max(200).optional(),
});

export type SewingHoldReasonValues = z.infer<typeof sewingHoldReasonSchema>;
