import { z } from "zod";

export const colorFormSchema = z.object({
  code: z.string().trim().min(1, "Color code is required").max(20),
  name: z.string().trim().min(1, "Color name is required").max(40),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color, e.g. #3b4d6b"),
  status: z.enum(["active", "inactive"]),
});

export type ColorFormValues = z.infer<typeof colorFormSchema>;

export const colorFormDefaults: ColorFormValues = {
  code: "",
  name: "",
  hex: "#3b4d6b",
  status: "active",
};
