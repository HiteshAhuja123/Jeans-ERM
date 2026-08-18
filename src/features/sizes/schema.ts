import { z } from "zod";

export const sizeFormSchema = z.object({
  code: z.string().trim().min(1, "Size code is required").max(20),
  displayName: z.string().trim().min(1, "Display name is required").max(40),
  sequence: z.coerce.number().int().min(0, "Sequence must be zero or more"),
  status: z.enum(["active", "inactive"]),
});

export type SizeFormValues = z.infer<typeof sizeFormSchema>;

export const sizeFormDefaults: SizeFormValues = {
  code: "",
  displayName: "",
  sequence: 0,
  status: "active",
};
