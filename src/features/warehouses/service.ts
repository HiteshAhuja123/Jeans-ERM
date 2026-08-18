import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockStorageLocations, mockWarehouses } from "@/mock-data";
import type { StorageLocation, Warehouse } from "@/types";

export const warehouseService = createMasterDataService<Warehouse>(mockWarehouses, "wh");
export const warehouseHooks = createMasterDataHooks("warehouses", warehouseService);

export const storageLocationService = createMasterDataService<StorageLocation>(mockStorageLocations, "loc");
export const storageLocationHooks = createMasterDataHooks("storage-locations", storageLocationService);
