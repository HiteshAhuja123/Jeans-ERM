import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockMaterials } from "@/mock-data";
import type { Material } from "@/types";

export const materialService = createMasterDataService<Material>(mockMaterials, "mat");
export const materialHooks = createMasterDataHooks("materials", materialService);
