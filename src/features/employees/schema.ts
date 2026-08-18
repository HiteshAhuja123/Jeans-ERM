import { z } from "zod";

export const employeeFormSchema = z.object({
  code: z.string().trim().min(1, "Employee code is required").max(20),
  name: z.string().trim().min(1, "Employee name is required").max(60),
  departmentId: z.string().min(1, "Select a department"),
  designation: z.string().trim().min(1, "Designation is required").max(60),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
  email: z.string().trim().email("Enter a valid email address").or(z.literal("")).optional(),
  status: z.enum(["active", "inactive"]),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const employeeFormDefaults: EmployeeFormValues = {
  code: "",
  name: "",
  departmentId: "",
  designation: "",
  phone: "",
  email: "",
  status: "active",
};
