import { z } from "zod";

export const customerFormSchema = z.object({
  code: z.string().trim().min(1, "Customer code is required").max(20),
  name: z.string().trim().min(1, "Customer name is required").max(80),
  type: z.enum(["brand", "retailer", "wholesaler", "individual"]),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(60),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
  address: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1, "City is required").max(60),
  country: z.string().trim().min(1, "Country is required").max(60),
  status: z.enum(["active", "inactive"]),
  notes: z.string().trim().max(300).optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const customerFormDefaults: CustomerFormValues = {
  code: "",
  name: "",
  type: "brand",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  status: "active",
  notes: "",
};
