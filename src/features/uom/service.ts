import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockUnitsOfMeasure } from "@/mock-data";
import type { UnitOfMeasure } from "@/types";

export const uomService = createMasterDataService<UnitOfMeasure>(mockUnitsOfMeasure, "uom");
export const uomHooks = createMasterDataHooks("uom", uomService);
