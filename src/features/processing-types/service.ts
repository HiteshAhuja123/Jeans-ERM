import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockProcessingTypes } from "@/mock-data";
import type { ProcessingType } from "@/types";

export const processingTypeService = createMasterDataService<ProcessingType>(mockProcessingTypes, "pty");
export const processingTypeHooks = createMasterDataHooks("processing-types", processingTypeService);
