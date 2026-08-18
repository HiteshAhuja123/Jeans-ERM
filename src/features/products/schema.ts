import { z } from "zod";

export const productFormSchema = z.object({
  code: z.string().trim().min(1, "Product code is required").max(30),
  name: z.string().trim().min(1, "Product name is required").max(80),
  category: z.string().trim().min(1, "Category is required").max(60),
  description: z.string().trim().max(240).optional(),
  status: z.enum(["active", "inactive"]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const productFormDefaults: ProductFormValues = {
  code: "",
  name: "",
  category: "",
  description: "",
  status: "active",
};
