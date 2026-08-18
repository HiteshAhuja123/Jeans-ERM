import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockProductionLineMasters } from "@/mock-data";
import type { ProductionLine } from "@/types";

export const productionLineService = createMasterDataService<ProductionLine>(mockProductionLineMasters, "pl");
export const productionLineHooks = createMasterDataHooks("production-lines", productionLineService);
