"use client";

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";

import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination, usePagination } from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getGlobalActivityFeed } from "@/lib/audit";

export function ActivityReport() {
  const [search, setSearch] = useState("");
  const feed = useMemo(() => getGlobalActivityFeed(200), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return feed;
    return feed.filter((item) => item.actor.toLowerCase().includes(q) || item.action.toLowerCase().includes(q) || item.target.toLowerCase().includes(q));
  }, [feed, search]);

  const { page, pageCount, pageRows, setPage, pageSize, totalCount } = usePagination(filtered, 20);

  return (
    <div className="flex flex-col gap-5">
      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by user, action or record…" />

      {filtered.length === 0 ? (
        <EmptyState icon={Activity} title="No activity matches your search" description="Try a different search term." />
      ) : (
        <>
          <Card className="overflow-hidden">
            <ol className="flex flex-col divide-y divide-border">
              {pageRows.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-foreground">
                    <span className="font-medium">{item.actor}</span> — {item.action}
                    <span className="text-muted-foreground"> · {item.target}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalCount={totalCount} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
