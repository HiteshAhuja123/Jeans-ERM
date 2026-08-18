import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockOrders } from "@/mock-data";
import type { Order } from "@/types";

export const orderService = createMasterDataService<Order>(mockOrders, "ord");
export const orderHooks = createMasterDataHooks("orders", orderService);
