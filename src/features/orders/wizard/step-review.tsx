"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { orderPriorityMeta } from "@/lib/status";
import type { OrderFormValues } from "@/features/orders/schema";
import type { Color, Customer, Size, Style } from "@/types";

interface StepReviewProps {
  form: UseFormReturn<OrderFormValues>;
  customers: Customer[];
  styles: Style[];
  colors: Color[];
  sizes: Size[];
}

export function StepReview({ form, customers, styles, colors, sizes }: StepReviewProps) {
  const values = useWatch({ control: form.control });
  const customer = customers.find((c) => c.id === values.customerId);
  const lineItems = values.lineItems ?? [];
  const grandTotal = lineItems.reduce(
    (sum, item) => sum + (item?.sizeBreakdown ?? []).reduce((s, e) => s + (Number(e?.quantity) || 0), 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Review &amp; Create</h2>
        <p className="text-sm text-muted-foreground">Check everything before creating the order.</p>
      </div>

      <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Customer</span>
          <span className="text-sm font-medium text-foreground">{customer?.name ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Order Number</span>
          <span className="text-sm font-medium text-foreground">{values.orderNumber}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Priority</span>
          <StatusBadge
            label={orderPriorityMeta[values.priority ?? "normal"].label}
            level={orderPriorityMeta[values.priority ?? "normal"].level}
            hideIcon
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Order Date</span>
          <span className="text-sm font-medium text-foreground">
            {values.orderDate ? formatDate(values.orderDate) : "—"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Delivery Date</span>
          <span className="text-sm font-medium text-foreground">
            {values.dueDate ? formatDate(values.dueDate) : "—"}
          </span>
        </div>
        {values.customerReference && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Customer Reference</span>
            <span className="text-sm font-medium text-foreground">{values.customerReference}</span>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Items</span>
        {lineItems.map((item, index) => {
          const style = styles.find((s) => s.id === item?.styleId);
          const color = colors.find((c) => c.id === item?.colorId);
          const itemTotal = (item?.sizeBreakdown ?? []).reduce((s, e) => s + (Number(e?.quantity) || 0), 0);
          const nonZero = (item?.sizeBreakdown ?? []).filter((e) => (e?.quantity ?? 0) > 0);
          return (
            <Card key={index} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {style ? `${style.styleCode} · ${style.name}` : "—"} {color ? `· ${color.name}` : ""}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {itemTotal.toLocaleString()} pcs
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {nonZero
                  .map((e) => `${sizes.find((s) => s.id === e.sizeId)?.displayName ?? "—"}: ${e.quantity}`)
                  .join(" · ") || "No quantities entered"}
              </span>
            </Card>
          );
        })}
      </div>

      <Card className="flex items-center justify-between bg-muted/50 p-4">
        <span className="text-sm font-semibold text-foreground">Order Total</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">{grandTotal.toLocaleString()} pcs</span>
      </Card>

      {(values.deliveryLocation || values.shippingInstructions) && (
        <Card className="flex flex-col gap-2 p-4">
          {values.deliveryLocation && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Delivery Location</span>
              <span className="text-sm text-foreground">{values.deliveryLocation}</span>
            </div>
          )}
          {values.shippingInstructions && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Shipping Instructions</span>
              <span className="text-sm text-foreground">{values.shippingInstructions}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
