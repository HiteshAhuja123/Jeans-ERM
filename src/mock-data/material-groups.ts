import type { MaterialGroup } from "@/types";

export const mockMaterialGroups: MaterialGroup[] = [
  { id: "mg-001", code: "DENIM", name: "Denim Fabric", parentCategory: "fabric", status: "active" },
  { id: "mg-002", code: "STRETCH", name: "Stretch Fabric", parentCategory: "fabric", status: "active" },
  { id: "mg-003", code: "BTNRVT", name: "Buttons & Rivets", parentCategory: "accessory", status: "active" },
  { id: "mg-004", code: "ZIP", name: "Zippers", parentCategory: "accessory", status: "active" },
  { id: "mg-005", code: "THREAD", name: "Thread", parentCategory: "raw_material", status: "active" },
  { id: "mg-006", code: "LABEL", name: "Labels & Tags", parentCategory: "raw_material", status: "active" },
  { id: "mg-007", code: "PACK", name: "Packaging", parentCategory: "raw_material", status: "active" },
];
