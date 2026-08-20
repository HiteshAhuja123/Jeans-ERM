import type { SewingDefect, SewingOrder, SewingOrderBundle, SewingProductionEntry, SewingRework } from "@/types";

/**
 * Seed Sewing Orders trace back to Phase 7's cutting batches: prod-121/122 are historical
 * (fully sewn, already handed off downstream), prod-125 is running behind pace (partially
 * completed, rework pending), prod-127 is actively in progress (one bundle mid-run — see item
 * 13 Partial Sewing), and prod-128 is assigned to a line but not yet started.
 */
export const mockSewingOrders: SewingOrder[] = [
  {
    id: "sew-121",
    sewingOrderNumber: "SEW-2026-00101",
    productionOrderId: "prod-121",
    productionOrderNumber: "PROD-2026-00121",
    orderId: "ord-012",
    orderNumber: "ORD-2026-00463",
    customerId: "cust-003",
    customerName: "Northline Trading",
    styleId: "style-005",
    styleCode: "BOOT-210",
    styleName: "Bootcut 210",
    colorId: "color-001",
    colorName: "Indigo",
    quantity: 1200,
    unit: "pcs",
    priority: "normal",
    productionLineId: "pl-002",
    supervisor: "Priya Kulkarni",
    plannedStart: "2026-08-10",
    plannedEnd: "2026-08-12",
    actualStart: "2026-08-10T08:30:00",
    actualEnd: "2026-08-12T17:00:00",
    status: "completed",
    createdDate: "2026-08-09",
  },
  {
    id: "sew-122",
    sewingOrderNumber: "SEW-2026-00102",
    productionOrderId: "prod-122",
    productionOrderNumber: "PROD-2026-00122",
    orderId: "ord-001",
    orderNumber: "ORD-2026-00452",
    customerId: "cust-001",
    customerName: "Urban Denim Co.",
    styleId: "style-001",
    styleCode: "SLIM-502",
    styleName: "Slim 502",
    colorId: "color-001",
    colorName: "Indigo",
    quantity: 800,
    unit: "pcs",
    priority: "high",
    productionLineId: "pl-003",
    supervisor: "Arjun Nair",
    plannedStart: "2026-08-15",
    plannedEnd: "2026-08-17",
    actualStart: "2026-08-15T08:30:00",
    actualEnd: "2026-08-17T17:00:00",
    status: "completed",
    createdDate: "2026-08-14",
  },
  {
    id: "sew-125",
    sewingOrderNumber: "SEW-2026-00103",
    productionOrderId: "prod-125",
    productionOrderNumber: "PROD-2026-00125",
    orderId: "ord-003",
    orderNumber: "ORD-2026-00454",
    customerId: "cust-002",
    customerName: "Bluewash Apparel",
    styleId: "style-003",
    styleCode: "TAP-330",
    styleName: "Tapered 330",
    colorId: "color-005",
    colorName: "Grey",
    quantity: 1100,
    unit: "pcs",
    priority: "high",
    productionLineId: "pl-003",
    supervisor: "Arjun Nair",
    plannedStart: "2026-08-13",
    plannedEnd: "2026-08-19",
    actualStart: "2026-08-13T08:30:00",
    status: "partially_completed",
    createdDate: "2026-08-12",
    notes: "Behind pace — sewing line running short-staffed this week. Two bundles still waiting on the line.",
  },
  {
    id: "sew-127",
    sewingOrderNumber: "SEW-2026-00104",
    productionOrderId: "prod-127",
    productionOrderNumber: "PROD-2026-00127",
    orderId: "ord-007",
    orderNumber: "ORD-2026-00458",
    customerId: "cust-006",
    customerName: "Meridian Clothing",
    styleId: "style-001",
    styleCode: "SLIM-502",
    styleName: "Slim 502",
    colorId: "color-001",
    colorName: "Indigo",
    quantity: 200,
    unit: "pcs",
    priority: "urgent",
    productionLineId: "pl-002",
    supervisor: "Priya Kulkarni",
    plannedStart: "2026-08-19",
    plannedEnd: "2026-08-21",
    actualStart: "2026-08-19T09:00:00",
    status: "in_progress",
    createdDate: "2026-08-18",
    notes: "Customer delivery date has already passed — expedite where possible.",
  },
  {
    id: "sew-128",
    sewingOrderNumber: "SEW-2026-00105",
    productionOrderId: "prod-128",
    productionOrderNumber: "PROD-2026-00128",
    orderId: "ord-005",
    orderNumber: "ORD-2026-00456",
    customerId: "cust-005",
    customerName: "Westgate Garments",
    styleId: "style-005",
    styleCode: "BOOT-210",
    styleName: "Bootcut 210",
    colorId: "color-001",
    colorName: "Indigo",
    quantity: 500,
    unit: "pcs",
    priority: "normal",
    productionLineId: "pl-002",
    supervisor: "Priya Kulkarni",
    plannedStart: "2026-08-21",
    plannedEnd: "2026-08-23",
    status: "assigned",
    createdDate: "2026-08-19",
  },
];

// ---------------------------------------------------------------------------
// Bundle assignment
// ---------------------------------------------------------------------------

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

function bId(seq: number): string {
  return `bnd-${seq}`;
}

function bNumber(seq: number): string {
  return `BND-2026-${String(seq).padStart(5, "0")}`;
}

function linkBundles(sewingOrderId: string, seqs: number[], quantity: number, assignedDate: string): SewingOrderBundle[] {
  return seqs.map((seq, i) => ({
    id: `sob-${sewingOrderId}-${i + 1}`,
    sewingOrderId,
    bundleId: bId(seq),
    bundleNumber: bNumber(seq),
    quantity,
    assignedDate,
  }));
}

const sew121Bundles = range(835, 846); // 12 bundles x 100 pcs
const sew122Bundles = range(847, 862); // 16 bundles x 50 pcs
const sew125Bundles = range(863, 884); // 22 bundles x 50 pcs (2 still unprocessed — see below)
const sew127Bundles = [821, 822, 823, 825]; // 4 of cb-127-1's 8 bundles
const sew128Bundles = [829, 830, 831, 832, 833]; // 5 of cb-128-1's 6 bundles

export const mockSewingOrderBundles: SewingOrderBundle[] = [
  ...linkBundles("sew-121", sew121Bundles, 100, "2026-08-09"),
  ...linkBundles("sew-122", sew122Bundles, 50, "2026-08-14"),
  ...linkBundles("sew-125", sew125Bundles, 50, "2026-08-12"),
  ...linkBundles("sew-127", sew127Bundles, 50, "2026-08-18"),
  ...linkBundles("sew-128", sew128Bundles, 100, "2026-08-19"),
];

// ---------------------------------------------------------------------------
// Production entries
// ---------------------------------------------------------------------------

let entrySeq = 0;
function nextEntryId(): string {
  entrySeq += 1;
  return `spe-${String(entrySeq).padStart(3, "0")}`;
}

function makeEntry(
  sewingOrderId: string,
  seq: number,
  date: string,
  input: number,
  good: number,
  rejected: number,
  rework: number,
  recordedBy: string,
  notes?: string,
  recordedAt = "17:00:00",
): SewingProductionEntry {
  return {
    id: nextEntryId(),
    sewingOrderId,
    bundleId: bId(seq),
    bundleNumber: bNumber(seq),
    date,
    inputQuantity: input,
    goodQuantity: good,
    rejectedQuantity: rejected,
    reworkQuantity: rework,
    notes,
    recordedBy,
    recordedDate: `${date}T${recordedAt}`,
  };
}

function makeCleanEntries(sewingOrderId: string, seqs: number[], qty: number, date: string, recordedBy: string): SewingProductionEntry[] {
  return seqs.map((seq) => makeEntry(sewingOrderId, seq, date, qty, qty, 0, 0, recordedBy));
}

// sew-121 — 10 clean bundles, 2 with a minor stitch defect (both fully resolved by rework).
const clean121 = sew121Bundles.filter((s) => s !== 835 && s !== 841);
const sew121Issue1 = makeEntry("sew-121", 835, "2026-08-11", 100, 96, 2, 2, "Priya Kulkarni", "Minor stitch issue");
const sew121Issue2 = makeEntry("sew-121", 841, "2026-08-12", 100, 96, 2, 2, "Priya Kulkarni", "Loose thread on waistband");

// sew-122 — 14 clean bundles, 2 with defects (both fully resolved by rework).
const clean122 = sew122Bundles.filter((s) => s !== 847 && s !== 855);
const sew122Issue1 = makeEntry("sew-122", 847, "2026-08-16", 50, 47, 1, 2, "Arjun Nair", "Broken stitch on pocket");
const sew122Issue2 = makeEntry("sew-122", 855, "2026-08-16", 50, 47, 1, 2, "Arjun Nair", "Panel alignment off by a few mm");

// sew-125 — 17 of 20 processed bundles clean, 3 with a repeat panel-alignment defect (rework still pending).
const sew125Processed = sew125Bundles.filter((s) => s !== 872 && s !== 873);
const issue125 = [863, 870, 876];
const clean125 = sew125Processed.filter((s) => !issue125.includes(s));
const sew125Issue1 = makeEntry("sew-125", 863, "2026-08-14", 50, 46, 1, 3, "Arjun Nair", "Panel alignment off — waistband seam");
const sew125Issue2 = makeEntry("sew-125", 870, "2026-08-15", 50, 46, 1, 3, "Arjun Nair", "Panel alignment issue on rise");
const sew125Issue3 = makeEntry("sew-125", 876, "2026-08-16", 50, 46, 1, 3, "Arjun Nair", "Panel alignment issue — repeat defect this batch");

// sew-127 — bnd-821 fully sewn, bnd-822 partially sewn (30 of 50 pcs — see item 13 Partial Sewing).
const sew127Entry1 = makeEntry("sew-127", 821, "2026-08-19", 50, 48, 1, 1, "Priya Kulkarni", "Minor stitch issue", "09:30:00");
const sew127Entry2 = makeEntry("sew-127", 822, "2026-08-19", 30, 28, 1, 1, "Priya Kulkarni", "First run — remainder of this bundle later today", "14:00:00");

export const mockSewingProductionEntries: SewingProductionEntry[] = [
  ...makeCleanEntries("sew-121", clean121, 100, "2026-08-11", "Priya Kulkarni"),
  sew121Issue1,
  sew121Issue2,
  ...makeCleanEntries("sew-122", clean122, 50, "2026-08-16", "Arjun Nair"),
  sew122Issue1,
  sew122Issue2,
  ...makeCleanEntries("sew-125", clean125, 50, "2026-08-15", "Arjun Nair"),
  sew125Issue1,
  sew125Issue2,
  sew125Issue3,
  sew127Entry1,
  sew127Entry2,
];

// ---------------------------------------------------------------------------
// Defects — reason-level record behind each entry's rejected + rework quantity.
// ---------------------------------------------------------------------------

let defectSeq = 0;
function nextDefectId(): string {
  defectSeq += 1;
  return `sdf-${String(defectSeq).padStart(3, "0")}`;
}

function makeDefect(entry: SewingProductionEntry, reasonId: string): SewingDefect {
  return {
    id: nextDefectId(),
    sewingOrderId: entry.sewingOrderId,
    bundleId: entry.bundleId,
    productionEntryId: entry.id,
    reasonId,
    quantity: entry.rejectedQuantity + entry.reworkQuantity,
    notes: entry.notes,
    recordedBy: entry.recordedBy,
    date: entry.date,
  };
}

const defect121a = makeDefect(sew121Issue1, "sdr-003"); // Uneven Stitch
const defect121b = makeDefect(sew121Issue2, "sdr-005"); // Loose Thread
const defect122a = makeDefect(sew122Issue1, "sdr-002"); // Broken Stitch
const defect122b = makeDefect(sew122Issue2, "sdr-007"); // Panel Alignment
const defect125a = makeDefect(sew125Issue1, "sdr-007");
const defect125b = makeDefect(sew125Issue2, "sdr-007");
const defect125c = makeDefect(sew125Issue3, "sdr-007");
const defect127a = makeDefect(sew127Entry1, "sdr-005"); // Loose Thread
const defect127b = makeDefect(sew127Entry2, "sdr-001"); // Open Seam

export const mockSewingDefects: SewingDefect[] = [
  defect121a,
  defect121b,
  defect122a,
  defect122b,
  defect125a,
  defect125b,
  defect125c,
  defect127a,
  defect127b,
];

// ---------------------------------------------------------------------------
// Rework
// ---------------------------------------------------------------------------

let reworkSeq = 0;
function nextReworkNumber(): string {
  reworkSeq += 1;
  return `REWORK-2026-${String(reworkSeq).padStart(4, "0")}`;
}

export const mockSewingReworks: SewingRework[] = [
  {
    id: "rwk-001",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-121",
    bundleId: bId(835),
    productionEntryId: sew121Issue1.id,
    defectId: defect121a.id,
    quantity: 2,
    reasonId: "sdr-003",
    status: "completed",
    completedQuantity: 2,
    rejectedQuantity: 0,
    createdDate: "2026-08-11",
    completedDate: "2026-08-11",
    recordedBy: "Priya Kulkarni",
  },
  {
    id: "rwk-002",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-121",
    bundleId: bId(841),
    productionEntryId: sew121Issue2.id,
    defectId: defect121b.id,
    quantity: 2,
    reasonId: "sdr-005",
    status: "completed",
    completedQuantity: 1,
    rejectedQuantity: 1,
    createdDate: "2026-08-12",
    completedDate: "2026-08-12",
    recordedBy: "Priya Kulkarni",
  },
  {
    id: "rwk-003",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-122",
    bundleId: bId(847),
    productionEntryId: sew122Issue1.id,
    defectId: defect122a.id,
    quantity: 2,
    reasonId: "sdr-002",
    status: "completed",
    completedQuantity: 2,
    rejectedQuantity: 0,
    createdDate: "2026-08-16",
    completedDate: "2026-08-17",
    recordedBy: "Arjun Nair",
  },
  {
    id: "rwk-004",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-122",
    bundleId: bId(855),
    productionEntryId: sew122Issue2.id,
    defectId: defect122b.id,
    quantity: 2,
    reasonId: "sdr-007",
    status: "completed",
    completedQuantity: 1,
    rejectedQuantity: 1,
    createdDate: "2026-08-16",
    completedDate: "2026-08-17",
    recordedBy: "Arjun Nair",
  },
  {
    id: "rwk-005",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-125",
    bundleId: bId(863),
    productionEntryId: sew125Issue1.id,
    defectId: defect125a.id,
    quantity: 3,
    reasonId: "sdr-007",
    status: "pending",
    createdDate: "2026-08-14",
    recordedBy: "Arjun Nair",
  },
  {
    id: "rwk-006",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-125",
    bundleId: bId(870),
    productionEntryId: sew125Issue2.id,
    defectId: defect125b.id,
    quantity: 3,
    reasonId: "sdr-007",
    status: "pending",
    createdDate: "2026-08-15",
    recordedBy: "Arjun Nair",
  },
  {
    id: "rwk-007",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-125",
    bundleId: bId(876),
    productionEntryId: sew125Issue3.id,
    defectId: defect125c.id,
    quantity: 3,
    reasonId: "sdr-007",
    status: "in_progress",
    createdDate: "2026-08-16",
    recordedBy: "Arjun Nair",
  },
  {
    id: "rwk-008",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-127",
    bundleId: bId(821),
    productionEntryId: sew127Entry1.id,
    defectId: defect127a.id,
    quantity: 1,
    reasonId: "sdr-005",
    status: "pending",
    createdDate: "2026-08-19",
    recordedBy: "Priya Kulkarni",
  },
  {
    id: "rwk-009",
    reworkNumber: nextReworkNumber(),
    sewingOrderId: "sew-127",
    bundleId: bId(822),
    productionEntryId: sew127Entry2.id,
    defectId: defect127b.id,
    quantity: 1,
    reasonId: "sdr-001",
    status: "pending",
    createdDate: "2026-08-19",
    recordedBy: "Priya Kulkarni",
  },
];
