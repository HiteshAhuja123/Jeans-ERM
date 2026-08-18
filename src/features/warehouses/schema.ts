import { z } from "zod";

export const warehouseFormSchema = z.object({
  code: z.string().trim().min(1, "Warehouse code is required").max(20),
  name: z.string().trim().min(1, "Warehouse name is required").max(80),
  type: z.enum(["raw_material", "finished_goods", "general"]),
  address: z.string().trim().max(200).optional(),
  status: z.enum(["active", "inactive"]),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export const warehouseFormDefaults: WarehouseFormValues = {
  code: "",
  name: "",
  type: "general",
  address: "",
  status: "active",
};

export const storageLocationFormSchema = z.object({
  code: z.string().trim().min(1, "Location code is required").max(20),
  name: z.string().trim().min(1, "Location name is required").max(60),
  status: z.enum(["active", "inactive"]),
});

export type StorageLocationFormValues = z.infer<typeof storageLocationFormSchema>;

export const storageLocationFormDefaults: StorageLocationFormValues = {
  code: "",
  name: "",
  status: "active",
};
