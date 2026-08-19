import { QrCode } from "lucide-react";

import { formatDate } from "@/lib/format";
import type { Bundle } from "@/types";

/** A displayable/printable bundle label. The QR code is a visual placeholder only — no scanning infrastructure yet. */
export function BundleLabel({ bundle }: { bundle: Bundle }) {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-5 text-center">
      <span className="text-lg font-bold tracking-tight text-foreground">{bundle.bundleNumber}</span>
      <span className="text-sm text-muted-foreground">{bundle.productionOrderNumber}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold text-foreground">{bundle.styleCode}</span>
        <span className="text-sm text-foreground">{bundle.colorName}</span>
        <span className="text-sm text-foreground">Size {bundle.items.map((i) => i.sizeCode).join(" + ")}</span>
      </div>
      <span className="text-2xl font-bold tabular-nums text-foreground">{bundle.quantity.toLocaleString()} PCS</span>
      <span className="text-xs text-muted-foreground">Created {formatDate(bundle.createdDate)}</span>
      <div className="flex size-24 items-center justify-center rounded-lg border border-border bg-muted">
        <QrCode className="size-16 text-foreground" aria-hidden="true" />
      </div>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{bundle.bundleNumber}</span>
    </div>
  );
}
