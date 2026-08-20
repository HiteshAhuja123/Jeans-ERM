import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { mockSewingLineOperations, mockSewingOperations } from "@/mock-data";
import type { SewingOperation } from "@/types";

export const sewingOperationService = createMasterDataService<SewingOperation>(mockSewingOperations, "sop");
export const sewingOperationHooks = createMasterDataHooks("sewing-operations", sewingOperationService);

/** Read-only for Phase 8 — the line/operation/operator association is seeded, not yet editable from the UI. */
export const mockSewingLineOperationAssignments = mockSewingLineOperations;
