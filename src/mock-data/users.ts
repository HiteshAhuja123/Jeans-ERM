import type { UserProfile } from "@/types";

export const currentUser: UserProfile = {
  id: "usr-001",
  name: "Hitesh Ahuja",
  email: "hitesh@ermjeans.com",
  role: "owner",
  initials: "HA",
};

export const mockUsers: UserProfile[] = [
  currentUser,
  {
    id: "usr-002",
    name: "Rakesh Verma",
    email: "rakesh.verma@ermjeans.com",
    role: "production_manager",
    initials: "RV",
  },
  {
    id: "usr-003",
    name: "Sunita Rao",
    email: "sunita.rao@ermjeans.com",
    role: "qc_manager",
    initials: "SR",
  },
  {
    id: "usr-004",
    name: "Vikram Shah",
    email: "vikram.shah@ermjeans.com",
    role: "purchase_manager",
    initials: "VS",
  },
  {
    id: "usr-005",
    name: "Anjali Mehta",
    email: "anjali.mehta@ermjeans.com",
    role: "store_manager",
    initials: "AM",
  },
];

export const roleLabels: Record<UserProfile["role"], string> = {
  owner: "Factory Owner",
  management: "Management",
  production_manager: "Production Manager",
  production_supervisor: "Production Supervisor",
  store_manager: "Store / Inventory Manager",
  purchase_manager: "Purchase Manager",
  qc_manager: "QC Manager",
  qc_staff: "QC Staff",
  cutting_staff: "Cutting Staff",
  sewing_staff: "Sewing Staff",
  packing_staff: "Packing Staff",
  dispatch_staff: "Dispatch Staff",
  admin_staff: "Administrative Staff",
};
