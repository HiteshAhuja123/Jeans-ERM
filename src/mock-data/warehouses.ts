import type { StorageLocation, Warehouse } from "@/types";

export const mockWarehouses: Warehouse[] = [
  {
    id: "wh-001",
    code: "RAW-01",
    name: "Raw Material Warehouse",
    type: "raw_material",
    address: "Plot 14, Industrial Area Phase 2, Ludhiana",
    status: "active",
  },
  {
    id: "wh-002",
    code: "FG-01",
    name: "Finished Goods Warehouse",
    type: "finished_goods",
    address: "Plot 22, Industrial Area Phase 2, Ludhiana",
    status: "active",
  },
  {
    id: "wh-003",
    code: "GEN-01",
    name: "General Store",
    type: "general",
    address: "Plot 14, Industrial Area Phase 2, Ludhiana",
    status: "inactive",
  },
];

export const mockStorageLocations: StorageLocation[] = [
  { id: "loc-001", code: "FABRIC-A", name: "Fabric Area", warehouseId: "wh-001", status: "active" },
  { id: "loc-002", code: "ACC-B", name: "Accessories Area", warehouseId: "wh-001", status: "active" },
  { id: "loc-003", code: "PACK-C", name: "Packaging Area", warehouseId: "wh-001", status: "active" },
  { id: "loc-004", code: "RACK-A", name: "Rack A", warehouseId: "wh-002", status: "active" },
  { id: "loc-005", code: "RACK-B", name: "Rack B", warehouseId: "wh-002", status: "active" },
];
