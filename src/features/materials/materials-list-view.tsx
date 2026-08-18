"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activeStatusMeta } from "@/lib/status";
import { materialHooks } from "@/features/materials/service";
import { MaterialFormSheet } from "@/features/materials/material-form-sheet";
import { mockMaterialGroups, mockUnitsOfMeasure } from "@/mock-data";
import type { Material, MasterStatus } from "@/types";

type StatusFilter = MasterStatus | "all";
type MaterialTab = "all" | "fabric" | "accessory";

function groupName(id: string) {
  return mockMaterialGroups.find((g) => g.id === id)?.name ?? "—";
}

function unitCode(id: string) {
  return mockUnitsOfMeasure.find((u) => u.id === id)?.code ?? "—";
}

export function MaterialsListView() {
  const router = useRouter();
  const { data: materials = [], isLoading } = materialHooks.useList();
  const setStatusMutation = materialHooks.useSetStatus();

  const [activeTab, setActiveTab] = useState<MaterialTab>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();

  const fabricCount = materials.filter((m) => mockMaterialGroups.find((g) => g.id === m.materialGroupId)?.parentCategory === "fabric").length;
  const accessoryCount = materials.length - fabricCount;
  const activeCount = materials.filter((m) => m.status === "active").length;

  const filtered = useMemo(() => {
    return materials
      .filter((m) => {
        const group = mockMaterialGroups.find((g) => g.id === m.materialGroupId);
        if (activeTab === "fabric") return group?.parentCategory === "fabric";
        if (activeTab === "accessory") return group?.parentCategory !== "fabric";
        return true;
      })
      .filter((m) => statusFilter === "all" || m.status === statusFilter)
      .filter((m) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
      });
  }, [materials, activeTab, search, statusFilter]);

  function openCreate() {
    setEditingMaterial(undefined);
    setSheetOpen(true);
  }

  function openEdit(material: Material) {
    setEditingMaterial(material);
    setSheetOpen(true);
  }

  async function handleToggleStatus(material: Material) {
    const next: MasterStatus = material.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: material.id, status: next });
    toast.success(`${material.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Material>[] = [
    { key: "code", header: "Code", render: (m) => <span className="font-medium text-foreground">{m.code}</span> },
    { key: "name", header: "Name", render: (m) => m.name },
    { key: "group", header: "Group", render: (m) => groupName(m.materialGroupId) },
    { key: "unit", header: "Unit", render: (m) => unitCode(m.uomId) },
    {
      key: "status",
      header: "Status",
      render: (m) => <StatusBadge label={activeStatusMeta[m.status].label} level={activeStatusMeta[m.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <RowActionsMenu
          status={m.status}
          onView={() => router.push(`/masters/materials/${m.id}`)}
          onEdit={() => openEdit(m)}
          onToggleStatus={() => handleToggleStatus(m)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Materials"
        description="Fabric, accessories, thread, labels and packaging in one configurable master"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Material
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Materials" value={materials.length.toString()} icon={Boxes} />
        <StatCard label="Fabrics" value={fabricCount.toString()} icon={Boxes} accent="info" />
        <StatCard label="Accessories & Other" value={accessoryCount.toString()} icon={Boxes} />
        <StatCard label="Active" value={activeCount.toString()} icon={Boxes} accent="success" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MaterialTab)}>
        <TabsList>
          <TabsTrigger value="all">All Materials</TabsTrigger>
          <TabsTrigger value="fabric">Fabrics</TabsTrigger>
          <TabsTrigger value="accessory">Accessories</TabsTrigger>
        </TabsList>

        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search materials…" className="mt-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <Card className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </Card>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No materials match your filters"
              description="Try a different search term or status, or add a new material."
            />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={filtered} onRowClick={(m) => router.push(`/masters/materials/${m.id}`)} />
              <MasterDataCards
                rows={filtered}
                renderCard={(m) => (
                  <Card className="flex items-center justify-between p-4" onClick={() => router.push(`/masters/materials/${m.id}`)}>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{m.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.code} · {groupName(m.materialGroupId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge label={activeStatusMeta[m.status].label} level={activeStatusMeta[m.status].level} hideIcon />
                      <RowActionsMenu status={m.status} onEdit={() => openEdit(m)} onToggleStatus={() => handleToggleStatus(m)} />
                    </div>
                  </Card>
                )}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <MaterialFormSheet open={sheetOpen} onOpenChange={setSheetOpen} material={editingMaterial} existingMaterials={materials} />
    </div>
  );
}
