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
import { productHooks } from "@/features/products/service";
import { ProductFormSheet } from "@/features/products/product-form-sheet";
import { mockStyles } from "@/mock-data";

export function ProductDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: product, isLoading } = productHooks.useDetail(id);
  const { data: products = [] } = productHooks.useList();
  const [sheetOpen, setSheetOpen] = useState(false);

  const styles = useMemo(() => mockStyles.filter((s) => s.productId === id), [id]);

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

  if (!product) {
    return (
      <EmptyState
        icon={PackageX}
        title="Product not found"
        description="This product may have been removed."
        action={{ label: "Back to Products", onClick: () => router.push("/masters/products") }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/masters/products"
        backLabel="Back to Products"
        title={product.name}
        subtitle={`${product.code} · ${product.category}`}
        statusLabel={activeStatusMeta[product.status].label}
        statusLevel={activeStatusMeta[product.status].level}
        onEdit={() => setSheetOpen(true)}
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="styles">Styles ({styles.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <span className="text-sm font-medium text-foreground">{product.category}</span>
                </div>
                {product.description && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Description</span>
                    <span className="text-sm text-foreground">{product.description}</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="styles" className="mt-4">
              {styles.length === 0 ? (
                <EmptyState
                  icon={PackageX}
                  title="No styles yet"
                  description="Styles created for this product will appear here."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {styles.map((style) => (
                    <Card
                      key={style.id}
                      className="flex cursor-pointer items-center justify-between p-4"
                      onClick={() => router.push(`/masters/styles/${style.id}`)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{style.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {style.styleCode} · {style.fit} · {style.fabricType}
                        </span>
                      </div>
                      <StatusBadge label={activeStatusMeta[style.status].label} level={activeStatusMeta[style.status].level} hideIcon />
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        }
      />

      <ProductFormSheet open={sheetOpen} onOpenChange={setSheetOpen} product={product} existingProducts={products} />
    </div>
  );
}
