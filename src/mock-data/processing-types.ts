import type { ProcessingType } from "@/types";

/** Configurable — the factory's actual washing/processing steps vary by style and season. */
export const mockProcessingTypes: ProcessingType[] = [
  { id: "pty-001", code: "STONE", name: "Stone Wash", sequence: 1, status: "active" },
  { id: "pty-002", code: "ENZYME", name: "Enzyme Wash", sequence: 2, status: "active" },
  { id: "pty-003", code: "ACID", name: "Acid Wash", sequence: 3, status: "active" },
  { id: "pty-004", code: "BLEACH", name: "Bleach Wash", sequence: 4, status: "active" },
  { id: "pty-005", code: "SILICON", name: "Silicon Wash", sequence: 5, status: "active" },
  { id: "pty-006", code: "GDYE", name: "Garment Dye", sequence: 6, status: "active" },
  { id: "pty-007", code: "WHISKER", name: "Whisker / Hand Work", sequence: 7, status: "inactive" },
];
