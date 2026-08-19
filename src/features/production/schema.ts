import { z } from "zod";

export const productionOrderQuickEditSchema = z
  .object({
    productionLineId: z.string().optional(),
    plannedStart: z.string().min(1, "Enter a planned start date"),
    plannedEnd: z.string().min(1, "Enter a planned end date"),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.plannedEnd >= data.plannedStart, {
    message: "Planned end cannot be before the planned start.",
    path: ["plannedEnd"],
  });

export type ProductionOrderQuickEditValues = z.infer<typeof productionOrderQuickEditSchema>;

export const planItemFormSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  orderLineItemId: z.string().min(1, "Select an order item"),
  quantity: z.coerce.number().positive("Enter a quantity greater than 0"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  plannedStart: z.string().min(1, "Enter a planned start date"),
  plannedEnd: z.string().min(1, "Enter a planned end date"),
  productionLineId: z.string().optional(),
});

export type PlanItemFormValues = z.infer<typeof planItemFormSchema>;

export const createPlanFormSchema = z
  .object({
    periodStart: z.string().min(1, "Enter a period start date"),
    periodEnd: z.string().min(1, "Enter a period end date"),
    planner: z.string().trim().min(1, "Enter a planner name"),
    notes: z.string().max(500).optional(),
    items: z.array(planItemFormSchema).min(1, "Add at least one production order to this plan"),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: "Period end cannot be before the period start.",
    path: ["periodEnd"],
  })
  .superRefine((data, ctx) => {
    data.items.forEach((item, index) => {
      if (item.plannedEnd < item.plannedStart) {
        ctx.addIssue({
          code: "custom",
          message: "Planned end cannot be before the planned start.",
          path: ["items", index, "plannedEnd"],
        });
      }
    });
  });

export type CreatePlanFormValues = z.infer<typeof createPlanFormSchema>;
