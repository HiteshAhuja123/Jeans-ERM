import type { Bom, BomItem } from "@/types";

function trims(): BomItem[] {
  return [
    { id: "bom-item-thread", materialId: "mat-008", materialCode: "RAW-THR-POL", materialName: "Polyester Thread Cone", quantityPerPiece: 0.008, unit: "KG", wastagePercent: 3 },
    { id: "bom-item-button", materialId: "mat-006", materialCode: "ACC-BTN-JN", materialName: "Jean Button 17mm", quantityPerPiece: 2, unit: "PCS", wastagePercent: 0 },
    { id: "bom-item-rivet", materialId: "mat-007", materialCode: "ACC-RVT-CU", materialName: "Copper Rivets", quantityPerPiece: 4, unit: "PCS", wastagePercent: 0 },
    { id: "bom-item-zipper", materialId: "mat-005", materialCode: "ACC-ZIP-YKK", materialName: "YKK Zipper 5.5in", quantityPerPiece: 1, unit: "PCS", wastagePercent: 0 },
    { id: "bom-item-label", materialId: "mat-009", materialCode: "RAW-LBL-WV", materialName: "Woven Brand Labels", quantityPerPiece: 1, unit: "PCS", wastagePercent: 0 },
  ];
}

function fabricItem(materialId: string, materialCode: string, materialName: string, quantityPerPiece: number): BomItem {
  return { id: `bom-item-fabric-${materialId}`, materialId, materialCode, materialName, quantityPerPiece, unit: "MTR", wastagePercent: 5 };
}

export const mockBoms: Bom[] = [
  {
    id: "style-001",
    styleId: "style-001",
    styleCode: "SLIM-502",
    status: "active",
    items: [fabricItem("mat-003", "FAB-STR-95", "Stretch Denim 9.5 OZ", 1.1), ...trims()],
  },
  {
    id: "style-002",
    styleId: "style-002",
    styleCode: "STR-118",
    status: "active",
    items: [fabricItem("mat-002", "FAB-GRY-10", "Denim Grey 10 OZ", 1.3), ...trims()],
  },
  {
    id: "style-003",
    styleId: "style-003",
    styleCode: "TAP-330",
    status: "active",
    items: [fabricItem("mat-004", "FAB-IND-13", "Denim Indigo Rigid 13 OZ", 1.35), ...trims()],
  },
  {
    id: "style-004",
    styleId: "style-004",
    styleCode: "SKN-440",
    status: "active",
    items: [fabricItem("mat-003", "FAB-STR-95", "Stretch Denim 9.5 OZ", 1.05), ...trims()],
  },
  {
    id: "style-005",
    styleId: "style-005",
    styleCode: "BOOT-210",
    status: "active",
    items: [fabricItem("mat-001", "FAB-DBL-11", "Denim Blue 11 OZ", 1.4), ...trims()],
  },
  {
    id: "style-006",
    styleId: "style-006",
    styleCode: "RLX-075",
    status: "active",
    items: [fabricItem("mat-002", "FAB-GRY-10", "Denim Grey 10 OZ", 1.45), ...trims()],
  },
];
