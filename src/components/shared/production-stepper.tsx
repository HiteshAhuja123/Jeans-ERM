import { Ban, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { productionStageLabels } from "@/mock-data/production";
import type { ProductionStageProgress } from "@/types";

interface ProductionStepperProps {
  stages: ProductionStageProgress[];
  className?: string;
}

const nodeClasses: Record<ProductionStageProgress["status"], string> = {
  done: "bg-success border-success text-success-foreground",
  in_progress: "bg-info border-info text-info-foreground",
  blocked: "bg-critical border-critical text-critical-foreground",
  pending: "bg-card border-border text-muted-foreground",
};

const lineClasses: Record<ProductionStageProgress["status"], string> = {
  done: "bg-success",
  in_progress: "bg-info",
  blocked: "bg-critical",
  pending: "bg-border",
};

export function ProductionStepper({ stages, className }: ProductionStepperProps) {
  return (
    <div className={cn("overflow-x-auto pb-1", className)}>
      <ol className="flex min-w-max items-start gap-1">
        {stages.map((stage, index) => (
          <li key={stage.stage} className="flex items-start">
            <div className="flex w-20 flex-col items-center gap-1.5 text-center sm:w-24">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2",
                  nodeClasses[stage.status],
                )}
              >
                {stage.status === "done" && <Check className="size-4" aria-hidden="true" />}
                {stage.status === "in_progress" && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {stage.status === "blocked" && <Ban className="size-4" aria-hidden="true" />}
                {stage.status === "pending" && <span className="size-2 rounded-full bg-current" />}
              </span>
              <span className="text-xs font-medium text-foreground">
                {productionStageLabels[stage.stage]}
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {stage.completedPieces.toLocaleString()}/{stage.totalPieces.toLocaleString()}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={cn("mt-4 h-0.5 w-6 shrink-0 sm:w-10", lineClasses[stage.status])} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
