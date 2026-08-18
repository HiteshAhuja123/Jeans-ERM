import type { ProductionLine } from "@/types";

export const mockProductionLineMasters: ProductionLine[] = [
  { id: "pl-001", code: "CUT-L1", name: "Cutting Line 1", departmentId: "dept-001", capacity: 900, supervisor: "Deepak Patil", status: "active" },
  { id: "pl-002", code: "SEW-LA", name: "Sewing Line A", departmentId: "dept-002", capacity: 650, supervisor: "Priya Kulkarni", status: "active" },
  { id: "pl-003", code: "SEW-LB", name: "Sewing Line B", departmentId: "dept-002", capacity: 650, supervisor: "Arjun Nair", status: "active" },
  { id: "pl-004", code: "WASH-U1", name: "Washing Unit 1", departmentId: "dept-003", capacity: 950, supervisor: "Kiran Desai", status: "active" },
  { id: "pl-005", code: "FIN-L1", name: "Finishing Line 1", departmentId: "dept-004", capacity: 750, supervisor: "Meena Iyer", status: "active" },
  { id: "pl-006", code: "PACK-L1", name: "Packing Line 1", departmentId: "dept-008", capacity: 550, supervisor: "Ravi Chandran", status: "inactive" },
];
