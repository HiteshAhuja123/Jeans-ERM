import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockSizes } from "@/mock-data";
import type { Size } from "@/types";

export const sizeService = createMasterDataService<Size>(mockSizes, "size");
export const sizeHooks = createMasterDataHooks("sizes", sizeService);
