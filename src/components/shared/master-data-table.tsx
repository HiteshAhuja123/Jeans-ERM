"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface MasterDataColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T) => ReactNode;
}

interface MasterDataTableProps<T extends { id: string }> {
  columns: MasterDataColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export function MasterDataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  className,
}: MasterDataTableProps<T>) {
  return (
    <Card className={cn("hidden overflow-hidden md:block", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.align === "right" ? "text-right" : undefined}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(column.align === "right" ? "text-right" : undefined, column.className)}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
