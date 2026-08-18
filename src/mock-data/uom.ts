import type { UnitOfMeasure } from "@/types";

export const mockUnitsOfMeasure: UnitOfMeasure[] = [
  { id: "uom-001", code: "PCS", name: "Pieces", status: "active" },
  { id: "uom-002", code: "KG", name: "Kilograms", status: "active" },
  { id: "uom-003", code: "MTR", name: "Meters", status: "active" },
  { id: "uom-004", code: "ROLL", name: "Roll", status: "active" },
  { id: "uom-005", code: "BOX", name: "Box", status: "active" },
  { id: "uom-006", code: "CTN", name: "Carton", status: "active" },
  { id: "uom-007", code: "CONE", name: "Cone", status: "inactive" },
];
