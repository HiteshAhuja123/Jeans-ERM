import { z } from "zod";

export const productionLineFormSchema = z.object({
  code: z.string().trim().min(1, "Line code is required").max(20),
  name: z.string().trim().min(1, "Line name is required").max(60),
  departmentId: z.string().min(1, "Select a department"),
  capacity: z.coerce.number().int().min(0, "Capacity must be zero or more"),
  supervisor: z.string().trim().max(60).optional(),
  status: z.enum(["active", "inactive"]),
});

export type ProductionLineFormValues = z.infer<typeof productionLineFormSchema>;

export const productionLineFormDefaults: ProductionLineFormValues = {
  code: "",
  name: "",
  departmentId: "",
  capacity: 0,
  supervisor: "",
  status: "active",
};
