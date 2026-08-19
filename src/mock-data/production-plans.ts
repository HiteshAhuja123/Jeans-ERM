import type { ProductionPlan } from "@/types";

export const mockProductionPlans: ProductionPlan[] = [
  {
    id: "plan-001",
    planNumber: "PLAN-2026-0028",
    periodStart: "2026-07-10",
    periodEnd: "2026-07-28",
    planner: "Rakesh Verma",
    status: "completed",
    notes: "July replenishment batch.",
    createdDate: "2026-07-05",
  },
  {
    id: "plan-002",
    planNumber: "PLAN-2026-0031",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-24",
    planner: "Rakesh Verma",
    status: "in_progress",
    notes: "August production run across Sewing A/B and Cutting Line 1.",
    createdDate: "2026-07-28",
  },
  {
    id: "plan-003",
    planNumber: "PLAN-2026-0032",
    periodStart: "2026-08-15",
    periodEnd: "2026-09-05",
    planner: "Rakesh Verma",
    status: "in_progress",
    notes: "September delivery batch for Urban Denim Co. and Bluewash Apparel.",
    createdDate: "2026-08-12",
  },
];
