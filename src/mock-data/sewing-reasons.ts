import type { ReasonCode } from "@/types";

/** Configurable — a factory can add/retire sewing defect reasons without a code change. */
export const mockSewingDefectReasons: ReasonCode[] = [
  { id: "sdr-001", label: "Open Seam", status: "active" },
  { id: "sdr-002", label: "Broken Stitch", status: "active" },
  { id: "sdr-003", label: "Uneven Stitch", status: "active" },
  { id: "sdr-004", label: "Wrong Stitch", status: "active" },
  { id: "sdr-005", label: "Loose Thread", status: "active" },
  { id: "sdr-006", label: "Measurement Issue", status: "active" },
  { id: "sdr-007", label: "Panel Alignment", status: "active" },
  { id: "sdr-008", label: "Button Issue", status: "active" },
  { id: "sdr-009", label: "Zipper Issue", status: "active" },
  { id: "sdr-010", label: "Other", status: "active" },
];

export type SewingHoldReasonCategory =
  | "machine_issue"
  | "operator_shortage"
  | "material_issue"
  | "quality_issue"
  | "supervisor_decision"
  | "other";

export const sewingHoldReasonLabels: Record<SewingHoldReasonCategory, string> = {
  machine_issue: "Machine Issue",
  operator_shortage: "Operator Shortage",
  material_issue: "Material Issue",
  quality_issue: "Quality Issue",
  supervisor_decision: "Supervisor Decision",
  other: "Other",
};
