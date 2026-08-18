"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MasterDataCardsProps<T extends { id: string }> {
  rows: T[];
  renderCard: (row: T) => ReactNode;
  className?: string;
}

export function MasterDataCards<T extends { id: string }>({
  rows,
  renderCard,
  className,
}: MasterDataCardsProps<T>) {
  return (
    <div className={cn("flex flex-col gap-3 md:hidden", className)}>
      {rows.map((row) => (
        <div key={row.id}>{renderCard(row)}</div>
      ))}
    </div>
  );
}
