import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockSuppliers } from "@/mock-data";
import type { Supplier } from "@/types";

export const supplierService = createMasterDataService<Supplier>(mockSuppliers, "sup");
export const supplierHooks = createMasterDataHooks("suppliers", supplierService);
