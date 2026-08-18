import { z } from "zod";

export const processFormSchema = z.object({
  code: z.string().trim().min(1, "Process code is required").max(15),
  name: z.string().trim().min(1, "Process name is required").max(60),
  sequence: z.coerce.number().int().min(0, "Sequence must be zero or more"),
  departmentId: z.string(),
  status: z.enum(["active", "inactive"]),
});

export type ProcessFormValues = z.infer<typeof processFormSchema>;

/** Sentinel used by the department Select since Radix Select forbids an empty string value. */
export const NO_DEPARTMENT = "none";

export const processFormDefaults: ProcessFormValues = {
  code: "",
  name: "",
  sequence: 0,
  departmentId: NO_DEPARTMENT,
  status: "active",
};
