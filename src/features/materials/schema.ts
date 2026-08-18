import { z } from "zod";

export const NO_SUPPLIER = "none";
export const NO_COLOR = "none";

export const materialFormSchema = z.object({
  code: z.string().trim().min(1, "Material code is required").max(30),
  name: z.string().trim().min(1, "Material name is required").max(80),
  materialGroupId: z.string().min(1, "Select a material group"),
  uomId: z.string().min(1, "Select a unit"),
  supplierId: z.string(),
  colorId: z.string(),
  description: z.string().trim().max(240).optional(),
  composition: z.string().trim().max(120).optional(),
  weightOz: z.coerce.number().min(0).optional(),
  widthCm: z.coerce.number().min(0).optional(),
  stretch: z.boolean(),
  status: z.enum(["active", "inactive"]),
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

export const materialFormDefaults: MaterialFormValues = {
  code: "",
  name: "",
  materialGroupId: "",
  uomId: "",
  supplierId: NO_SUPPLIER,
  colorId: NO_COLOR,
  description: "",
  composition: "",
  weightOz: undefined,
  widthCm: undefined,
  stretch: false,
  status: "active",
};
