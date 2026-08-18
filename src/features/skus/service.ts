import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockSkus } from "@/mock-data";
import type { Sku } from "@/types";

export const skuService = createMasterDataService<Sku>(mockSkus, "sku");
export const skuHooks = createMasterDataHooks("skus", skuService);
