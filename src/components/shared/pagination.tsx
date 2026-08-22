"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Client-side pagination for a list page — slices `rows` and resets to page 1 whenever the filtered set shrinks below the current page. */
export function usePagination<T>(rows: T[], pageSize = 25) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  return { page: safePage, pageCount, pageRows, setPage, pageSize, totalCount: rows.length };
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  totalCount,
  pageSize,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
}) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalCount, page * pageSize);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <span className="text-xs text-muted-foreground">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {totalCount.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
