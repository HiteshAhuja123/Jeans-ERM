import { z } from "zod";

export const processingTypeFormSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(15),
  name: z.string().trim().min(1, "Name is required").max(60),
  sequence: z.coerce.number().int().min(0, "Sequence must be zero or more"),
  status: z.enum(["active", "inactive"]),
});

export type ProcessingTypeFormValues = z.infer<typeof processingTypeFormSchema>;

export const processingTypeFormDefaults: ProcessingTypeFormValues = {
  code: "",
  name: "",
  sequence: 0,
  status: "active",
};
