import type { Department } from "@/types";

export const mockDepartments: Department[] = [
  { id: "dept-001", code: "CUT", name: "Cutting", description: "Fabric cutting & spreading", status: "active" },
  { id: "dept-002", code: "SEW", name: "Sewing", description: "Stitching & assembly", status: "active" },
  { id: "dept-003", code: "WASH", name: "Washing", description: "Denim washing & processing", status: "active" },
  { id: "dept-004", code: "FIN", name: "Finishing", description: "Pressing, trimming & finishing", status: "active" },
  { id: "dept-005", code: "QC", name: "Quality", description: "Inspection & quality control", status: "active" },
  { id: "dept-006", code: "INV", name: "Inventory", description: "Stores & warehouse operations", status: "active" },
  { id: "dept-007", code: "PUR", name: "Purchase", description: "Procurement & vendor management", status: "active" },
  { id: "dept-008", code: "PACK", name: "Packing", description: "Packing & cartoning", status: "active" },
  { id: "dept-009", code: "DISP", name: "Dispatch", description: "Shipping & logistics", status: "active" },
  { id: "dept-010", code: "ADM", name: "Administration", description: "Office & administrative staff", status: "active" },
];
