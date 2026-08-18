import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockCustomers } from "@/mock-data";
import type { Customer } from "@/types";

export const customerService = createMasterDataService<Customer>(mockCustomers, "cust");
export const customerHooks = createMasterDataHooks("customers", customerService);
