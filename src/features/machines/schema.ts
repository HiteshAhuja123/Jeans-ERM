import { z } from "zod";

export const machineFormSchema = z.object({
  code: z.string().trim().min(1, "Machine code is required").max(20),
  name: z.string().trim().min(1, "Machine name is required").max(60),
  machineType: z.string().trim().min(1, "Machine type is required").max(60),
  departmentId: z.string().min(1, "Select a department"),
  productionLineId: z.string(),
  status: z.enum(["available", "running", "maintenance", "inactive"]),
});

export type MachineFormValues = z.infer<typeof machineFormSchema>;

export const NO_PRODUCTION_LINE = "none";

export const machineFormDefaults: MachineFormValues = {
  code: "",
  name: "",
  machineType: "",
  departmentId: "",
  productionLineId: NO_PRODUCTION_LINE,
  status: "available",
};
