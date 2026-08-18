import { z } from "zod";

export const uomFormSchema = z.object({
  code: z.string().trim().min(1, "Unit code is required").max(10),
  name: z.string().trim().min(1, "Unit name is required").max(40),
  status: z.enum(["active", "inactive"]),
});

export type UomFormValues = z.infer<typeof uomFormSchema>;

export const uomFormDefaults: UomFormValues = {
  code: "",
  name: "",
  status: "active",
};
