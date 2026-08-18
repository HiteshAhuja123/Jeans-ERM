import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockProcesses } from "@/mock-data";
import type { Process } from "@/types";

export const processService = createMasterDataService<Process>(mockProcesses, "proc");
export const processHooks = createMasterDataHooks("processes", processService);
