import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockProducts } from "@/mock-data";
import type { Product } from "@/types";

export const productService = createMasterDataService<Product>(mockProducts, "prod");
export const productHooks = createMasterDataHooks("products", productService);
