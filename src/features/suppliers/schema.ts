import { z } from "zod";

import type { MaterialCategory, SupplierType } from "@/types";

export const supplierFormSchema = z.object({
  code: z.string().trim().min(1, "Supplier code is required").max(20),
  name: z.string().trim().min(1, "Supplier name is required").max(80),
  type: z.enum(["fabric", "accessories", "packaging", "washing_vendor", "processing_vendor", "other"]),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(60),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
  address: z.string().trim().max(160).optional(),
  location: z.string().trim().min(1, "City / location is required").max(80),
  status: z.enum(["active", "inactive"]),
  notes: z.string().trim().max(300).optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const supplierFormDefaults: SupplierFormValues = {
  code: "",
  name: "",
  type: "fabric",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  location: "",
  status: "active",
  notes: "",
};

/** Keeps the legacy coarse `category` field (used by Purchasing/Inventory) in sync with the new supplier type. */
export const supplierTypeToCategory: Record<SupplierType, MaterialCategory> = {
  fabric: "fabric",
  accessories: "accessory",
  packaging: "raw_material",
  washing_vendor: "raw_material",
  processing_vendor: "raw_material",
  other: "raw_material",
};
