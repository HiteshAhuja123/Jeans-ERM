import { z } from "zod";

export const createDispatchOrderSchema = z.object({
  orderId: z.string().min(1, "Select an order"),
  dispatchDate: z.string().min(1, "Select a dispatch date"),
  carrier: z.string().max(80).optional(),
  trackingRef: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateDispatchOrderValues = z.infer<typeof createDispatchOrderSchema>;
