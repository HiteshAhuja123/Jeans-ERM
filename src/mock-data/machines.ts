import type { Machine } from "@/types";

export const mockMachines: Machine[] = [
  { id: "mac-001", code: "CUT-M01", name: "Auto Fabric Cutter 1", machineType: "Cutting Machine", departmentId: "dept-001", productionLineId: "pl-001", status: "running" },
  { id: "mac-002", code: "CUT-M02", name: "Auto Fabric Cutter 2", machineType: "Cutting Machine", departmentId: "dept-001", productionLineId: "pl-001", status: "available" },
  { id: "mac-003", code: "SEW-M01", name: "Single Needle Lockstitch 1", machineType: "Sewing Machine", departmentId: "dept-002", productionLineId: "pl-002", status: "running" },
  { id: "mac-004", code: "SEW-M02", name: "Overlock Machine 1", machineType: "Sewing Machine", departmentId: "dept-002", productionLineId: "pl-003", status: "maintenance" },
  { id: "mac-005", code: "WASH-M01", name: "Industrial Washer 1", machineType: "Washing Machine", departmentId: "dept-003", productionLineId: "pl-004", status: "running" },
  { id: "mac-006", code: "FIN-M01", name: "Steam Press 1", machineType: "Pressing Machine", departmentId: "dept-004", productionLineId: "pl-005", status: "available" },
  { id: "mac-007", code: "PACK-M01", name: "Carton Sealer 1", machineType: "Packing Machine", departmentId: "dept-008", productionLineId: "pl-006", status: "inactive" },
];
