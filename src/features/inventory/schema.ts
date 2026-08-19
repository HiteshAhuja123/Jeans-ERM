import { z } from "zod";

export const stockTransferSchema = z
  .object({
    fromWarehouseId: z.string().min(1, "Select a source warehouse"),
    fromLocationId: z.string().min(1, "Select a source location"),
    toWarehouseId: z.string().min(1, "Select a destination warehouse"),
    toLocationId: z.string().min(1, "Select a destination location"),
    quantity: z.coerce.number().int().positive("Enter a quantity greater than 0"),
    reason: z.string().max(200).optional(),
  })
  .refine((data) => !(data.fromWarehouseId === data.toWarehouseId && data.fromLocationId === data.toLocationId), {
    message: "Source and destination must be different locations",
    path: ["toLocationId"],
  });

export type StockTransferValues = z.infer<typeof stockTransferSchema>;

export const stockTransferDefaults: StockTransferValues = {
  fromWarehouseId: "",
  fromLocationId: "",
  toWarehouseId: "",
  toLocationId: "",
  quantity: 0,
  reason: "",
};

export const stockAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, "Select a warehouse"),
  locationId: z.string().min(1, "Select a location"),
  physicalQuantity: z.coerce.number().int().min(0, "Enter a quantity of 0 or more"),
  reason: z.string().trim().min(1, "Enter a reason for this adjustment").max(200),
});

export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;

export const stockAdjustmentDefaults: StockAdjustmentValues = {
  warehouseId: "",
  locationId: "",
  physicalQuantity: 0,
  reason: "",
};
