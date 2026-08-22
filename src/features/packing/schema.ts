import { z } from "zod";

export const createPackingOrderSchema = z
  .object({
    qcOrderId: z.string().min(1, "Select a QC order"),
    quantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    maxQuantity: z.coerce.number(),
    responsible: z.string().max(80).optional(),
    plannedStart: z.string().optional(),
    plannedEnd: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.quantity > data.maxQuantity) {
      ctx.addIssue({
        code: "custom",
        message: `Only ${data.maxQuantity.toLocaleString()} pieces are available from this QC order`,
        path: ["quantity"],
      });
    }
    if (data.plannedStart && data.plannedEnd && data.plannedEnd < data.plannedStart) {
      ctx.addIssue({ code: "custom", message: "Planned end cannot be before the planned start.", path: ["plannedEnd"] });
    }
  });

export type CreatePackingOrderValues = z.infer<typeof createPackingOrderSchema>;

export const recordPackingSchema = z
  .object({
    date: z.string().min(1, "Select a date"),
    packedQuantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    cartonCount: z.coerce.number().int().positive("Enter at least 1 carton"),
    maxPack: z.coerce.number(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxPack <= 0) {
      ctx.addIssue({ code: "custom", message: "This order has already been fully packed.", path: ["packedQuantity"] });
      return;
    }
    if (data.packedQuantity > data.maxPack) {
      ctx.addIssue({ code: "custom", message: `Only ${data.maxPack.toLocaleString()} pieces are available to pack`, path: ["packedQuantity"] });
    }
    if (data.cartonCount > data.packedQuantity) {
      ctx.addIssue({ code: "custom", message: "Cannot have more cartons than pieces packed", path: ["cartonCount"] });
    }
  });

export type RecordPackingValues = z.infer<typeof recordPackingSchema>;

export const packingHoldReasonSchema = z.object({
  category: z.enum(["machine_issue", "vendor_delay", "material_issue", "quality_issue", "staff_shortage", "supervisor_decision", "other"]),
  details: z.string().trim().max(200).optional(),
});

export type PackingHoldReasonValues = z.infer<typeof packingHoldReasonSchema>;
