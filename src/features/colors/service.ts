import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockColors } from "@/mock-data";
import type { Color } from "@/types";

export const colorService = createMasterDataService<Color>(mockColors, "color");
export const colorHooks = createMasterDataHooks("colors", colorService);
