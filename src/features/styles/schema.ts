import { z } from "zod";

export const styleFormSchema = z.object({
  styleCode: z.string().trim().min(1, "Style code is required").max(30),
  name: z.string().trim().min(1, "Style name is required").max(80),
  productId: z.string().min(1, "Select a product"),
  category: z.string().trim().min(1, "Category is required").max(60),
  gender: z.enum(["men", "women", "unisex", "kids"]),
  fit: z.string().trim().min(1, "Fit is required").max(40),
  fabricType: z.string().trim().min(1, "Fabric type is required").max(80),
  defaultOperationIds: z.array(z.string()),
  status: z.enum(["active", "inactive"]),
});

export type StyleFormValues = z.infer<typeof styleFormSchema>;

export const styleFormDefaults: StyleFormValues = {
  styleCode: "",
  name: "",
  productId: "",
  category: "",
  gender: "men",
  fit: "",
  fabricType: "",
  defaultOperationIds: [],
  status: "active",
};
