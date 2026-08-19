"use client";

import { useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bomHooks } from "@/features/production/service";
import { materialHooks } from "@/features/materials/service";
import type { Bom, BomItem, Style } from "@/types";

function emptyItem(materialId: string, code: string, name: string, unit: string): BomItem {
  return { id: `bom-item-${materialId}-${Date.now()}`, materialId, materialCode: code, materialName: name, quantityPerPiece: 0, unit, wastagePercent: 0 };
}

export function BomEditor({ style, bom }: { style: Style; bom?: Bom }) {
  const { data: materials = [] } = materialHooks.useList();
  const createMutation = bomHooks.useCreate();
  const updateMutation = bomHooks.useUpdate();

  const [items, setItems] = useState<BomItem[]>(bom?.items ?? []);
  const [addingMaterialId, setAddingMaterialId] = useState("");

  const availableMaterials = materials.filter(
    (m) => m.status === "active" && !items.some((item) => item.materialId === m.id),
  );

  function handleAddMaterial() {
    const material = materials.find((m) => m.id === addingMaterialId);
    if (!material) return;
    setItems((prev) => [...prev, emptyItem(material.id, material.code, material.name, "PCS")]);
    setAddingMaterialId("");
  }

  function updateItem(itemId: string, patch: Partial<BomItem>) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  const isDirty = JSON.stringify(items) !== JSON.stringify(bom?.items ?? []);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  async function handleSave() {
    try {
      if (bom) {
        await updateMutation.mutateAsync({ id: bom.id, patch: { items, status: bom.status } });
      } else {
        await createMutation.mutateAsync({ id: style.id, styleId: style.id, styleCode: style.styleCode, status: "active", items } as Omit<Bom, "id">);
      }
      toast.success(`Bill of Materials saved for ${style.styleCode}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Materials consumed per finished piece of {style.styleCode}, including wastage allowance.
        </p>
        <div className="flex items-center gap-2">
          <Select value={addingMaterialId} onValueChange={setAddingMaterialId}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Select material to add" />
            </SelectTrigger>
            <SelectContent>
              {availableMaterials.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.code} — {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={handleAddMaterial} disabled={!addingMaterialId}>
            <Plus /> Add
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Layers} title="No materials in this BOM yet" description="Add materials to define what this style consumes per piece." />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="w-28">Qty / Piece</TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="w-28">Wastage %</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{item.materialCode}</span>
                      <span className="text-xs text-muted-foreground">{item.materialName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.001"
                      value={item.quantityPerPiece}
                      onChange={(e) => updateItem(item.id, { quantityPerPiece: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={item.wastagePercent}
                      onChange={(e) => updateItem(item.id, { wastagePercent: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove material" onClick={() => removeItem(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Bill of Materials"}
        </Button>
      </div>
    </div>
  );
}
