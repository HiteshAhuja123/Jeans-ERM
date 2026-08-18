import type { Process } from "@/types";

export const mockProcesses: Process[] = [
  { id: "proc-001", code: "CUT", name: "Cutting", sequence: 1, departmentId: "dept-001", status: "active" },
  { id: "proc-002", code: "SEW", name: "Sewing", sequence: 2, departmentId: "dept-002", status: "active" },
  { id: "proc-003", code: "WASH", name: "Washing", sequence: 3, departmentId: "dept-003", status: "active" },
  { id: "proc-004", code: "FIN", name: "Finishing", sequence: 4, departmentId: "dept-004", status: "active" },
  { id: "proc-005", code: "IRON", name: "Ironing", sequence: 5, departmentId: "dept-004", status: "active" },
  { id: "proc-006", code: "QC", name: "Quality Check", sequence: 6, departmentId: "dept-005", status: "active" },
  { id: "proc-007", code: "PACK", name: "Packing", sequence: 7, departmentId: "dept-008", status: "active" },
];
