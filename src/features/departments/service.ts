import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockDepartments } from "@/mock-data";
import type { Department } from "@/types";

export const departmentService = createMasterDataService<Department>(mockDepartments, "dept");
export const departmentHooks = createMasterDataHooks("departments", departmentService);
