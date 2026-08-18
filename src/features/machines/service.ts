import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockMachines } from "@/mock-data";
import type { Machine } from "@/types";

export const machineService = createMasterDataService<Machine>(mockMachines, "mac");
export const machineHooks = createMasterDataHooks("machines", machineService);
