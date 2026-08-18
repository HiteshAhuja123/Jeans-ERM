"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activeStatusMeta } from "@/lib/status";
import { styleHooks } from "@/features/styles/service";
import { StyleFormSheet } from "@/features/styles/style-form-sheet";
import { mockColors, mockProcesses, mockProducts, mockSizes, mockSkus } from "@/mock-data";

export function StyleDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: style, isLoading } = styleHooks.useDetail(id);
  const { data: styles = [] } = styleHooks.useList();
  const [sheetOpen, setSheetOpen] = useState(false);

  const skus = useMemo(() => mockSkus.filter((s) => s.styleId === id), [id]);
  const operations = useMemo(
    () => (style ? mockProcesses.filter((p) => style.defaultOperationIds.includes(p.id)) : []),
    [style],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-5">
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (!style) {
    return (
      <EmptyState
        icon={PackageX}
        title="Style not found"
        description="This style may have been removed."
        action={{ label: "Back to Styles", onClick: () => router.push("/masters/styles") }}
      />
    );
  }

  const product = mockProducts.find((p) => p.id === style.productId);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/masters/styles"
        backLabel="Back to Styles"
        title={style.name}
        subtitle={`${style.styleCode} · ${product?.name ?? "—"}`}
        statusLabel={activeStatusMeta[style.status].label}
        statusLevel={activeStatusMeta[style.status].level}
        onEdit={() => setSheetOpen(true)}
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skus">SKUs ({skus.length})</TabsTrigger>
              <TabsTrigger value="operations">Default Operations ({operations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <span className="text-sm font-medium text-foreground">{style.category}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Gender</span>
                  <span className="text-sm font-medium text-foreground capitalize">{style.gender}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Fit</span>
                  <span className="text-sm font-medium text-foreground">{style.fit}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Fabric Type</span>
                  <span className="text-sm font-medium text-foreground">{style.fabricType}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Product</span>
                  <span className="text-sm font-medium text-foreground">{product?.name ?? "—"}</span>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="skus" className="mt-4">
              {skus.length === 0 ? (
                <EmptyState icon={PackageX} title="No SKUs yet" description="Color and size combinations for this style will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {skus.map((sku) => {
                    const color = mockColors.find((c) => c.id === sku.colorId);
                    const size = mockSizes.find((s) => s.id === sku.sizeId);
                    return (
                      <Card key={sku.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          {color && (
                            <span
                              className="inline-block size-4 shrink-0 rounded-full border border-border"
                              style={{ backgroundColor: color.hex }}
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">{sku.skuCode}</span>
                            <span className="text-xs text-muted-foreground">
                              {color?.name ?? "—"} · Size {size?.displayName ?? "—"}
                            </span>
                          </div>
                        </div>
                        <StatusBadge label={activeStatusMeta[sku.status].label} level={activeStatusMeta[sku.status].level} hideIcon />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="operations" className="mt-4">
              {operations.length === 0 ? (
                <EmptyState icon={PackageX} title="No default operations set" description="Add operations when editing this style." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {operations
                    .slice()
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((op) => (
                      <span
                        key={op.id}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                      >
                        {op.sequence}. {op.name}
                      </span>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        }
      />

      <StyleFormSheet open={sheetOpen} onOpenChange={setSheetOpen} style={style} existingStyles={styles} />
    </div>
  );
}
