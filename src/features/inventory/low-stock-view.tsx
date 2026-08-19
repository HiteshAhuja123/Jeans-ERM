"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CircleCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvailableStock, getStockStatus } from "@/lib/inventory-utils";
import { stockLevelMeta } from "@/lib/status";
import { inventoryHooks } from "@/features/inventory/service";
import { materialHooks } from "@/features/materials/service";
import { mockUnitsOfMeasure } from "@/mock-data";

export function LowStockView() {
  const router = useRouter();
  const { data: materials = [], isLoading: materialsLoading } = materialHooks.useList();
  const { data: balances = [], isLoading: balancesLoading } = inventoryHooks.useList();

  const rows = useMemo(() => {
    return materials
      .filter((material) => material.status === "active")
      .map((material) => {
        const balance = balances.find((b) => b.materialId === material.id);
        if (!balance) return null;
        const status = getStockStatus(balance);
        if (status !== "low" && status !== "critical" && status !== "out_of_stock") return null;
        return {
          material,
          balance,
          status,
          available: getAvailableStock(balance),
          unit: mockUnitsOfMeasure.find((u) => u.id === material.uomId)?.code ?? "",
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => a.available - b.available);
  }, [materials, balances]);

  const isLoading = materialsLoading || balancesLoading;

  function createRequest(materialId: string, reorderPoint: number, available: number) {
    const suggestedQty = Math.max(reorderPoint - available, 1);
    router.push(`/purchasing?newRequest=${materialId}&qty=${suggestedQty}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Low Stock" description="Materials at or below their reorder point" />

      {isLoading ? (
        <Card className="flex flex-col gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState icon={CircleCheck} title="Nothing is running low" description="All tracked materials are above their reorder point." />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const meta = stockLevelMeta[row.status];
            return (
              <Card key={row.material.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-subtle text-warning">
                    <AlertTriangle className="size-4.5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => router.push(`/inventory/stock/${row.material.id}`)}
                      className="text-left text-sm font-semibold text-foreground hover:underline"
                    >
                      {row.material.name}
                    </button>
                    <span className="text-xs text-muted-foreground">{row.material.code}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Available: <span className="font-medium text-foreground">{row.available.toLocaleString()} {row.unit}</span>
                      {" · "}Reorder Point:{" "}
                      <span className="font-medium text-foreground">{row.balance.reorderPoint.toLocaleString()} {row.unit}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
                  <StatusBadge label={meta.label} level={meta.level} />
                  <Button size="sm" onClick={() => createRequest(row.material.id, row.balance.reorderPoint, row.available)}>
                    Create Purchase Request
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
