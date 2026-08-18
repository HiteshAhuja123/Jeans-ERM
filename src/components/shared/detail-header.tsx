"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { StatusLevel } from "@/types";

interface DetailHeaderProps {
  backHref: string;
  backLabel?: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusLevel: StatusLevel;
  onEdit?: () => void;
  actions?: ReactNode;
  tabs?: ReactNode;
}

export function DetailHeader({
  backHref,
  backLabel = "Back",
  title,
  subtitle,
  statusLabel,
  statusLevel,
  onEdit,
  actions,
  tabs,
}: DetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
            <StatusBadge label={statusLabel} level={statusLevel} />
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
          )}
        </div>
      </div>
      {tabs}
    </div>
  );
}
