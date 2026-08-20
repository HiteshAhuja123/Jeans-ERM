import type { SewingLineOperation, SewingOperation } from "@/types";

/** Configurable operation master — a factory can add/retire/reorder operations without a code change. */
export const mockSewingOperations: SewingOperation[] = [
  { id: "sop-001", code: "POCKET", name: "Pocket Attachment", sequence: 1, status: "active" },
  { id: "sop-002", code: "FRISE", name: "Front Rise", sequence: 2, status: "active" },
  { id: "sop-003", code: "BRISE", name: "Back Rise", sequence: 3, status: "active" },
  { id: "sop-004", code: "SSEAM", name: "Side Seam", sequence: 4, status: "active" },
  { id: "sop-005", code: "INSEAM", name: "Inseam", sequence: 5, status: "active" },
  { id: "sop-006", code: "WBAND", name: "Waistband", sequence: 6, status: "active" },
  { id: "sop-007", code: "BLOOP", name: "Belt Loop", sequence: 7, status: "active" },
  { id: "sop-008", code: "ZIP", name: "Zipper", sequence: 8, status: "active" },
  { id: "sop-009", code: "BUTTON", name: "Button", sequence: 9, status: "active" },
  { id: "sop-010", code: "HEM", name: "Hem", sequence: 10, status: "active" },
  { id: "sop-011", code: "LABEL", name: "Label", sequence: 11, status: "active" },
  { id: "sop-012", code: "COINPKT", name: "Coin Pocket", sequence: 12, status: "inactive" },
];

/** Basic line <-> operation <-> operator association — not a line-balancing engine. */
export const mockSewingLineOperations: SewingLineOperation[] = [
  { id: "slo-001", productionLineId: "pl-002", operationId: "sop-001", sequence: 1, operatorId: "emp-010" },
  { id: "slo-002", productionLineId: "pl-002", operationId: "sop-003", sequence: 3, operatorId: "emp-011" },
  { id: "slo-003", productionLineId: "pl-002", operationId: "sop-004", sequence: 4, operatorId: "emp-012" },
  { id: "slo-004", productionLineId: "pl-002", operationId: "sop-005", sequence: 5, operatorId: "emp-013" },
  { id: "slo-005", productionLineId: "pl-002", operationId: "sop-008", sequence: 8 },
  { id: "slo-006", productionLineId: "pl-003", operationId: "sop-001", sequence: 1, operatorId: "emp-013" },
  { id: "slo-007", productionLineId: "pl-003", operationId: "sop-004", sequence: 4, operatorId: "emp-010" },
  { id: "slo-008", productionLineId: "pl-003", operationId: "sop-006", sequence: 6, operatorId: "emp-011" },
  { id: "slo-009", productionLineId: "pl-003", operationId: "sop-010", sequence: 10, operatorId: "emp-012" },
];
