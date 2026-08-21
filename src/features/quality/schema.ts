import { z } from "zod";

export const createQcOrderSchema = z.object({
  finishingOrderId: z.string().min(1, "Select a finishing order"),
  quantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
  maxQuantity: z.coerce.number(),
  inspector: z.string().max(80).optional(),
  plannedStart: z.string().optional(),
  notes: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.quantity > data.maxQuantity) {
    ctx.addIssue({
      code: "custom",
      message: `Only ${data.maxQuantity.toLocaleString()} pieces are available from this finishing order`,
      path: ["quantity"],
    });
  }
});

export type CreateQcOrderValues = z.infer<typeof createQcOrderSchema>;

export const recordQcInspectionSchema = z
  .object({
    date: z.string().min(1, "Select a date"),
    inspectedQuantity: z.coerce.number().int().positive("Enter an inspected quantity greater than 0"),
    passedQuantity: z.coerce.number().int().min(0),
    reworkQuantity: z.coerce.number().int().min(0),
    rejectedQuantity: z.coerce.number().int().min(0),
    maxInspect: z.coerce.number(),
    defectReasonId: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxInspect <= 0) {
      ctx.addIssue({ code: "custom", message: "This order has already been fully inspected.", path: ["inspectedQuantity"] });
      return;
    }
    if (data.inspectedQuantity > data.maxInspect) {
      ctx.addIssue({ code: "custom", message: `Only ${data.maxInspect.toLocaleString()} pieces are available to inspect`, path: ["inspectedQuantity"] });
    }
    const sum = data.passedQuantity + data.reworkQuantity + data.rejectedQuantity;
    if (sum !== data.inspectedQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Passed + Rework + Rejected must total the inspected quantity (${data.inspectedQuantity.toLocaleString()}) — currently ${sum.toLocaleString()}`,
        path: ["passedQuantity"],
      });
    }
    if (data.reworkQuantity + data.rejectedQuantity > 0 && !data.defectReasonId) {
      ctx.addIssue({ code: "custom", message: "Select a reason for the rework/rejected pieces", path: ["defectReasonId"] });
    }
  });

export type RecordQcInspectionValues = z.infer<typeof recordQcInspectionSchema>;

export const completeQcReworkSchema = z
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

export type CompleteQcReworkValues = z.infer<typeof completeQcReworkSchema>;

export const qcHoldReasonSchema = z.object({
  category: z.enum(["machine_issue", "vendor_delay", "material_issue", "quality_issue", "staff_shortage", "supervisor_decision", "other"]),
  details: z.string().trim().max(200).optional(),
});

export type QcHoldReasonValues = z.infer<typeof qcHoldReasonSchema>;
