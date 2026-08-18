import { z } from "zod";

export const skuFormSchema = z.object({
  styleId: z.string().min(1, "Select a style"),
  colorId: z.string().min(1, "Select a color"),
  sizeId: z.string().min(1, "Select a size"),
  status: z.enum(["active", "inactive"]),
});

export type SkuFormValues = z.infer<typeof skuFormSchema>;

export const skuFormDefaults: SkuFormValues = {
  styleId: "",
  colorId: "",
  sizeId: "",
  status: "active",
};
