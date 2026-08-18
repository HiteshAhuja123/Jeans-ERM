import { z } from "zod";

export const departmentFormSchema = z.object({
  code: z.string().trim().min(1, "Department code is required").max(15),
  name: z.string().trim().min(1, "Department name is required").max(60),
  description: z.string().trim().max(200).optional(),
  status: z.enum(["active", "inactive"]),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const departmentFormDefaults: DepartmentFormValues = {
  code: "",
  name: "",
  description: "",
  status: "active",
};
