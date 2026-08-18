"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { activeStatusMeta } from "@/lib/status";
import { materialHooks } from "@/features/materials/service";
import { MaterialFormSheet } from "@/features/materials/material-form-sheet";
import { mockColors, mockMaterialGroups, mockSuppliers, mockUnitsOfMeasure } from "@/mock-data";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function MaterialDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: material, isLoading } = materialHooks.useDetail(id);
  const { data: materials = [] } = materialHooks.useList();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-5">
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    );
  }

  if (!material) {
    return (
      <EmptyState
        icon={PackageX}
        title="Material not found"
        description="This material may have been removed."
        action={{ label: "Back to Materials", onClick: () => router.push("/masters/materials") }}
      />
    );
  }

  const group = mockMaterialGroups.find((g) => g.id === material.materialGroupId);
  const unit = mockUnitsOfMeasure.find((u) => u.id === material.uomId);
  const supplier = mockSuppliers.find((s) => s.id === material.supplierId);
  const color = mockColors.find((c) => c.id === material.colorId);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/masters/materials"
        backLabel="Back to Materials"
        title={material.name}
        subtitle={material.code}
        statusLabel={activeStatusMeta[material.status].label}
        statusLevel={activeStatusMeta[material.status].level}
        onEdit={() => setSheetOpen(true)}
      />

      <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
        <Field label="Material Group" value={group?.name ?? "—"} />
        <Field label="Unit" value={unit?.name ?? "—"} />
        <Field label="Color" value={color?.name ?? "Not set"} />
        <Field
          label="Preferred Supplier"
          value={supplier ? supplier.name : "Not set"}
        />
        {material.description && (
          <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
            <span className="text-xs text-muted-foreground">Description</span>
            <span className="text-sm text-foreground">{material.description}</span>
          </div>
        )}
      </Card>

      {supplier && (
        <p className="text-xs text-muted-foreground">
          Sourced from{" "}
          <Link href={`/masters/suppliers/${supplier.id}`} className="font-medium text-primary hover:underline">
            {supplier.name}
          </Link>
        </p>
      )}

      {material.fabricDetails && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">Fabric Details</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Field label="Composition" value={material.fabricDetails.composition || "—"} />
            <Field label="Weight" value={material.fabricDetails.weightOz ? `${material.fabricDetails.weightOz} OZ` : "—"} />
            <Field label="Width" value={material.fabricDetails.widthCm ? `${material.fabricDetails.widthCm} cm` : "—"} />
            <Field label="Stretch" value={material.fabricDetails.stretch ? "Yes" : "No"} />
          </div>
        </Card>
      )}

      <MaterialFormSheet open={sheetOpen} onOpenChange={setSheetOpen} material={material} existingMaterials={materials} />
    </div>
  );
}
