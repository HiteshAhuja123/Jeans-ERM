import type { MaterialReservation } from "@/types";

/**
 * Illustrative seed reservations for a handful of already-released production orders —
 * a partial trace of why some material is currently shown as "Reserved" in Phase 5's
 * inventory balances. Going forward, releasing a Production Order creates new records here.
 */
export const mockMaterialReservations: MaterialReservation[] = [
  { id: "res-001", productionOrderId: "prod-118", materialId: "mat-002", quantity: 4680, createdDate: "2026-08-01" },
  { id: "res-002", productionOrderId: "prod-120", materialId: "mat-002", quantity: 8700, createdDate: "2026-08-02" },
  { id: "res-003", productionOrderId: "prod-121", materialId: "mat-001", quantity: 4200, createdDate: "2026-08-05" },
  { id: "res-004", productionOrderId: "prod-122", materialId: "mat-003", quantity: 2090, createdDate: "2026-08-15" },
  { id: "res-005", productionOrderId: "prod-123", materialId: "mat-002", quantity: 1820, createdDate: "2026-08-16" },
  { id: "res-006", productionOrderId: "prod-127", materialId: "mat-003", quantity: 1980, createdDate: "2026-08-06" },
  { id: "res-007", productionOrderId: "prod-128", materialId: "mat-001", quantity: 6300, createdDate: "2026-08-03" },
];
