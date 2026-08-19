import type { ReasonCode } from "@/types";

/** Configurable — a factory can add/retire reasons without a code change. */
export const mockWastageReasons: ReasonCode[] = [
  { id: "wr-001", label: "Normal Cutting Waste", status: "active" },
  { id: "wr-002", label: "Fabric Defect", status: "active" },
  { id: "wr-003", label: "Pattern Adjustment", status: "active" },
  { id: "wr-004", label: "Damaged Fabric", status: "active" },
  { id: "wr-005", label: "Spillage / Handling", status: "active" },
  { id: "wr-006", label: "Other", status: "active" },
];

export const mockCuttingRejectionReasons: ReasonCode[] = [
  { id: "cr-001", label: "Fabric Defect", status: "active" },
  { id: "cr-002", label: "Panel Defect", status: "active" },
  { id: "cr-003", label: "Wrong Cut", status: "active" },
  { id: "cr-004", label: "Pattern Mismatch", status: "active" },
  { id: "cr-005", label: "Measurement Issue", status: "active" },
  { id: "cr-006", label: "Damaged Panel", status: "active" },
  { id: "cr-007", label: "Other", status: "active" },
];
