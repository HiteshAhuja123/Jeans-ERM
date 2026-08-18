import { Card } from "@/components/ui/card";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { productionStageLabels } from "@/mock-data/production";
import type { ProductionLineSummary } from "@/types";

export function ProductionLineCard({ line }: { line: ProductionLineSummary }) {
  const percent = line.target > 0 ? Math.round((line.completed / line.target) * 100) : 0;
  const level = percent >= 95 ? "success" : percent >= 70 ? "info" : "warning";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{line.name}</span>
          <span className="text-xs text-muted-foreground">{line.supervisor}</span>
        </div>
        <StatusBadge label={productionStageLabels[line.stage]} level="info" hideIcon />
      </div>
      <LabeledProgress label="Today's output" current={line.completed} total={line.target} level={level} />
      <div className="text-xs text-muted-foreground">
        Working on <span className="font-medium text-foreground">{line.activeOrderNumber}</span>
      </div>
    </Card>
  );
}
