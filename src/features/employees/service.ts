import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockEmployees } from "@/mock-data";
import type { Employee } from "@/types";

export const employeeService = createMasterDataService<Employee>(mockEmployees, "emp");
export const employeeHooks = createMasterDataHooks("employees", employeeService);
