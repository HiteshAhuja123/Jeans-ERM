"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinOff, Plus } from "lucide-react";
import { toast } from "sonner";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activeStatusMeta } from "@/lib/status";
import { WarehouseFormSheet } from "@/features/warehouses/warehouse-form-sheet";
import { StorageLocationFormSheet } from "@/features/warehouses/storage-location-form-sheet";
import { storageLocationHooks, warehouseHooks } from "@/features/warehouses/service";
import type { MasterStatus, StorageLocation } from "@/types";

const typeLabels: Record<string, string> = {
  raw_material: "Raw Material",
  finished_goods: "Finished Goods",
  general: "General",
};

export function WarehouseDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: warehouse, isLoading } = warehouseHooks.useDetail(id);
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: allLocations = [] } = storageLocationHooks.useList();
  const setLocationStatusMutation = storageLocationHooks.useSetStatus();

  const [warehouseSheetOpen, setWarehouseSheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | undefined>();

  const locations = useMemo(() => allLocations.filter((l) => l.warehouseId === id), [allLocations, id]);

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

  if (!warehouse) {
    return (
      <EmptyState
        icon={MapPinOff}
        title="Warehouse not found"
        description="This warehouse may have been removed."
        action={{ label: "Back to Warehouses", onClick: () => router.push("/masters/warehouses") }}
      />
    );
  }

  async function handleToggleLocationStatus(location: StorageLocation) {
    const next: MasterStatus = location.status === "active" ? "inactive" : "active";
    await setLocationStatusMutation.mutateAsync({ id: location.id, status: next });
    toast.success(`${location.name} marked ${next}`);
  }

  const columns: MasterDataColumn<StorageLocation>[] = [
    { key: "code", header: "Code", render: (l) => <span className="font-medium text-foreground">{l.code}</span> },
    { key: "name", header: "Name", render: (l) => l.name },
    {
      key: "status",
      header: "Status",
      render: (l) => <StatusBadge label={activeStatusMeta[l.status].label} level={activeStatusMeta[l.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (l) => (
        <RowActionsMenu
          status={l.status}
          onEdit={() => {
            setEditingLocation(l);
            setLocationSheetOpen(true);
          }}
          onToggleStatus={() => handleToggleLocationStatus(l)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/masters/warehouses"
        backLabel="Back to Warehouses"
        title={warehouse.name}
        subtitle={`${warehouse.code} · ${typeLabels[warehouse.type]}`}
        statusLabel={activeStatusMeta[warehouse.status].label}
        statusLevel={activeStatusMeta[warehouse.status].level}
        onEdit={() => setWarehouseSheetOpen(true)}
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="locations">Storage Locations ({locations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <span className="text-sm font-medium text-foreground">{typeLabels[warehouse.type]}</span>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Address</span>
                  <span className="text-sm font-medium text-foreground">{warehouse.address || "Not set"}</span>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="mt-4">
              <div className="mb-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingLocation(undefined);
                    setLocationSheetOpen(true);
                  }}
                >
                  <Plus /> Add Location
                </Button>
              </div>
              {locations.length === 0 ? (
                <EmptyState
                  icon={MapPinOff}
                  title="No storage locations yet"
                  description="Add fabric, accessories or packaging areas inside this warehouse."
                />
              ) : (
                <>
                  <MasterDataTable columns={columns} rows={locations} />
                  <MasterDataCards
                    rows={locations}
                    renderCard={(l) => (
                      <Card className="flex items-center justify-between p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{l.name}</span>
                          <span className="text-xs text-muted-foreground">Code: {l.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge label={activeStatusMeta[l.status].label} level={activeStatusMeta[l.status].level} hideIcon />
                          <RowActionsMenu
                            status={l.status}
                            onEdit={() => {
                              setEditingLocation(l);
                              setLocationSheetOpen(true);
                            }}
                            onToggleStatus={() => handleToggleLocationStatus(l)}
                          />
                        </div>
                      </Card>
                    )}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        }
      />

      <WarehouseFormSheet
        open={warehouseSheetOpen}
        onOpenChange={setWarehouseSheetOpen}
        warehouse={warehouse}
        existingWarehouses={warehouses}
      />
      <StorageLocationFormSheet
        open={locationSheetOpen}
        onOpenChange={setLocationSheetOpen}
        warehouseId={warehouse.id}
        warehouseName={warehouse.name}
        location={editingLocation}
        existingLocations={locations}
      />
    </div>
  );
}
