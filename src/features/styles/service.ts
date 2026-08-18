import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockStyles } from "@/mock-data";
import type { Style } from "@/types";

export const styleService = createMasterDataService<Style>(mockStyles, "style");
export const styleHooks = createMasterDataHooks("styles", styleService);
