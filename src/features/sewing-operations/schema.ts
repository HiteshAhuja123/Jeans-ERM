import { z } from "zod";

export const sewingOperationFormSchema = z.object({
  code: z.string().trim().min(1, "Operation code is required").max(15),
  name: z.string().trim().min(1, "Operation name is required").max(60),
  sequence: z.coerce.number().int().min(0, "Sequence must be zero or more"),
  status: z.enum(["active", "inactive"]),
});

export type SewingOperationFormValues = z.infer<typeof sewingOperationFormSchema>;

export const sewingOperationFormDefaults: SewingOperationFormValues = {
  code: "",
  name: "",
  sequence: 0,
  status: "active",
};
