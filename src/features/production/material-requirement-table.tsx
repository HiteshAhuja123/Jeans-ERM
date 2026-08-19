"use client";

import { Check, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { materialAvailabilityMeta, type MaterialRequirementLine } from "@/lib/production-utils";

function formatQty(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function MaterialRequirementTable({ lines }: { lines: MaterialRequirementLine[] }) {
  return (
    <>
      <Card className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Required</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">On Order</TableHead>
              <TableHead className="text-right">Shortage</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.materialId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{line.materialCode}</span>
                    <span className="text-xs text-muted-foreground">{line.materialName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQty(line.required)} {line.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQty(line.available)} {line.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatQty(line.reserved)} {line.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {line.onOrder > 0 ? `${formatQty(line.onOrder)} ${line.unit}` : "—"}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", line.shortage > 0 && "font-medium text-critical")}>
                  {line.shortage > 0 ? `${formatQty(line.shortage)} ${line.unit}` : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={line.status === "shortage" ? "Shortage" : line.status === "available" ? "Available" : "Unknown"}
                    level={line.status === "shortage" ? "critical" : line.status === "available" ? "success" : "neutral"}
                    hideIcon
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 md:hidden">
        {lines.map((line) => (
          <Card key={line.materialId} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {line.status === "shortage" ? (
                  <X className="size-4 shrink-0 text-critical" aria-hidden="true" />
                ) : (
                  <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                )}
                <span className="text-sm font-semibold text-foreground">{line.materialCode}</span>
              </div>
              <StatusBadge
                label={line.status === "shortage" ? "Shortage" : line.status === "available" ? "Available" : "Unknown"}
                level={line.status === "shortage" ? "critical" : line.status === "available" ? "success" : "neutral"}
                hideIcon
              />
            </div>
            <span className="text-xs text-muted-foreground">{line.materialName}</span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Required</span>
                <span className="font-medium text-foreground tabular-nums">{formatQty(line.required)} {line.unit}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Available</span>
                <span className="font-medium text-foreground tabular-nums">{formatQty(line.available)} {line.unit}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Shortage</span>
                <span className={cn("font-medium tabular-nums", line.shortage > 0 ? "text-critical" : "text-foreground")}>
                  {line.shortage > 0 ? `${formatQty(line.shortage)} ${line.unit}` : "—"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function MaterialAvailabilityBadge({ availability }: { availability: keyof typeof materialAvailabilityMeta }) {
  const meta = materialAvailabilityMeta[availability];
  return <StatusBadge label={meta.label} level={meta.level} />;
}
