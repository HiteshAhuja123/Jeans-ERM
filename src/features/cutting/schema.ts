import { z } from "zod";

export const issueFabricSchema = z
  .object({
    quantity: z.coerce.number().positive("Enter a quantity greater than 0"),
    maxIssuable: z.coerce.number(),
    warehouseId: z.string().min(1, "Select a warehouse"),
    locationId: z.string().min(1, "Select a location"),
  })
  .superRefine((data, ctx) => {
    if (data.quantity > data.maxIssuable) {
      ctx.addIssue({
        code: "custom",
        message: `Cannot exceed the allocated balance (${data.maxIssuable.toLocaleString()})`,
        path: ["quantity"],
      });
    }
  });

export type IssueFabricValues = z.infer<typeof issueFabricSchema>;

export const returnMaterialSchema = z
  .object({
    quantity: z.coerce.number().positive("Enter a quantity greater than 0"),
    maxReturnable: z.coerce.number(),
    warehouseId: z.string().min(1, "Select a warehouse"),
    locationId: z.string().min(1, "Select a location"),
    reason: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.quantity > data.maxReturnable) {
      ctx.addIssue({
        code: "custom",
        message: `Cannot exceed the unused fabric balance (${data.maxReturnable.toLocaleString()})`,
        path: ["quantity"],
      });
    }
  });

export type ReturnMaterialValues = z.infer<typeof returnMaterialSchema>;

const cuttingOutputSizeLineSchema = z.object({
  sizeId: z.string(),
  sizeCode: z.string(),
  quantity: z.coerce.number().int().min(0),
});

const cuttingOutputRejectionLineSchema = z.object({
  reasonId: z.string(),
  label: z.string(),
  quantity: z.coerce.number().int().min(0),
});

export const recordCuttingOutputSchema = z
  .object({
    cutQuantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    rejectedQuantity: z.coerce.number().int().min(0),
    fabricUsed: z.coerce.number().min(0),
    maxCutQuantity: z.coerce.number(),
    wastageReasonId: z.string().optional(),
    notes: z.string().max(500).optional(),
    sizeLines: z.array(cuttingOutputSizeLineSchema),
    rejectionLines: z.array(cuttingOutputRejectionLineSchema),
  })
  .superRefine((data, ctx) => {
    if (data.rejectedQuantity > data.cutQuantity) {
      ctx.addIssue({ code: "custom", message: "Rejected quantity cannot exceed the cut quantity", path: ["rejectedQuantity"] });
    }
    if (data.cutQuantity > data.maxCutQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Actual cut cannot exceed the remaining planned quantity (${data.maxCutQuantity.toLocaleString()} pcs)`,
        path: ["cutQuantity"],
      });
    }
    const goodQuantity = Math.max(0, data.cutQuantity - data.rejectedQuantity);
    const sizeSum = data.sizeLines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    if (sizeSum !== goodQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Size breakdown must total the good output (${goodQuantity.toLocaleString()} pcs) — currently ${sizeSum.toLocaleString()}`,
        path: ["sizeLines"],
      });
    }
    const rejectionSum = data.rejectionLines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    if (data.rejectedQuantity > 0 && rejectionSum !== data.rejectedQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Rejection reasons must total the rejected quantity (${data.rejectedQuantity.toLocaleString()} pcs) — currently ${rejectionSum.toLocaleString()}`,
        path: ["rejectionLines"],
      });
    }
  });

export type RecordCuttingOutputValues = z.infer<typeof recordCuttingOutputSchema>;

export const generateBundlesSchema = z
  .object({
    sizeId: z.string().min(1, "Select a size"),
    bundleSize: z.coerce.number().int().positive("Enter a bundle size greater than 0"),
    numberOfBundles: z.coerce.number().int().positive("Enter at least 1 bundle"),
    maxAvailable: z.coerce.number(),
  })
  .superRefine((data, ctx) => {
    const total = data.bundleSize * data.numberOfBundles;
    if (total > data.maxAvailable) {
      ctx.addIssue({
        code: "custom",
        message: `Only ${data.maxAvailable.toLocaleString()} pcs are available for bundling in this size`,
        path: ["numberOfBundles"],
      });
    }
  });

export type GenerateBundlesValues = z.infer<typeof generateBundlesSchema>;

export const holdReasonSchema = z.object({
  reason: z.string().trim().min(1, "Enter a reason").max(200),
});

export type HoldReasonValues = z.infer<typeof holdReasonSchema>;

export const newCuttingBatchSchema = z
  .object({
    plannedQuantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    maxPlannable: z.coerce.number(),
    supervisor: z.string().optional(),
    operator: z.string().optional(),
    machineId: z.string().optional(),
    plannedStart: z.string().optional(),
    plannedEnd: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.plannedQuantity > data.maxPlannable) {
      ctx.addIssue({
        code: "custom",
        message: `Cannot exceed the remaining unplanned quantity (${data.maxPlannable.toLocaleString()} pcs)`,
        path: ["plannedQuantity"],
      });
    }
  });

export type NewCuttingBatchValues = z.infer<typeof newCuttingBatchSchema>;

export const cuttingOrderQuickEditSchema = z
  .object({
    supervisor: z.string().optional(),
    machineId: z.string().optional(),
    plannedStart: z.string().optional(),
    plannedEnd: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => !data.plannedStart || !data.plannedEnd || data.plannedEnd >= data.plannedStart, {
    message: "Planned end cannot be before the planned start.",
    path: ["plannedEnd"],
  });

export type CuttingOrderQuickEditValues = z.infer<typeof cuttingOrderQuickEditSchema>;
