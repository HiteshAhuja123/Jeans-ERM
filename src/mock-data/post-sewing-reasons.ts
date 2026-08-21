import type { ReasonCode } from "@/types";

/** Configurable — issues/defects found during Finishing. */
export const mockFinishingIssueReasons: ReasonCode[] = [
  { id: "fir-001", label: "Wash Tone Variation", status: "active" },
  { id: "fir-002", label: "Stain / Spot", status: "active" },
  { id: "fir-003", label: "Thread Trimming Issue", status: "active" },
  { id: "fir-004", label: "Pressing Defect", status: "active" },
  { id: "fir-005", label: "Missing Accessory", status: "active" },
  { id: "fir-006", label: "Other", status: "active" },
];

/** Configurable — QC defect/rejection reasons. */
export const mockQcDefectReasons: ReasonCode[] = [
  { id: "qcr-001", label: "Wash Shade Mismatch", status: "active" },
  { id: "qcr-002", label: "Measurement Out of Tolerance", status: "active" },
  { id: "qcr-003", label: "Stitching Defect", status: "active" },
  { id: "qcr-004", label: "Fabric Defect", status: "active" },
  { id: "qcr-005", label: "Accessory Defect", status: "active" },
  { id: "qcr-006", label: "Stain / Spot", status: "active" },
  { id: "qcr-007", label: "Labeling Error", status: "active" },
  { id: "qcr-008", label: "Other", status: "active" },
];

export type PostSewingHoldReasonCategory =
  | "machine_issue"
  | "vendor_delay"
  | "material_issue"
  | "quality_issue"
  | "staff_shortage"
  | "supervisor_decision"
  | "other";

export const postSewingHoldReasonLabels: Record<PostSewingHoldReasonCategory, string> = {
  machine_issue: "Machine Issue",
  vendor_delay: "Vendor Delay",
  material_issue: "Material Issue",
  quality_issue: "Quality Issue",
  staff_shortage: "Staff Shortage",
  supervisor_decision: "Supervisor Decision",
  other: "Other",
};
