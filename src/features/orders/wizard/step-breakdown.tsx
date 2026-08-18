"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { OrderFormValues } from "@/features/orders/schema";
import type { Color, Size, Style } from "@/types";

function ItemBreakdownCard({
  form,
  index,
  sizes,
  styleLabel,
  colorLabel,
}: {
  form: UseFormReturn<OrderFormValues>;
  index: number;
  sizes: Size[];
  styleLabel: string;
  colorLabel: string;
}) {
  const values = useWatch({ control: form.control, name: `lineItems.${index}.sizeBreakdown` }) ?? [];
  const total = values.reduce((sum, entry) => sum + (Number(entry?.quantity) || 0), 0);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">{styleLabel}</span>
          <span className="truncate text-xs text-muted-foreground">{colorLabel}</span>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {total.toLocaleString()} pcs
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {sizes.map((size, sizeIndex) => (
          <FormField
            key={size.id}
            control={form.control}
            name={`lineItems.${index}.sizeBreakdown.${sizeIndex}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{size.displayName}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="text-center tabular-nums"
                    {...field}
                    onChange={(e) => field.onChange(Math.max(0, Number(e.target.value) || 0))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </div>

      <FormField control={form.control} name={`lineItems.${index}.sizeBreakdown`} render={() => <FormMessage />} />
    </Card>
  );
}

interface StepBreakdownProps {
  form: UseFormReturn<OrderFormValues>;
  styles: Style[];
  colors: Color[];
  sizes: Size[];
}

export function StepBreakdown({ form, styles, colors, sizes }: StepBreakdownProps) {
  const lineItems = useWatch({ control: form.control, name: "lineItems" }) ?? [];

  const grandTotal = lineItems.reduce(
    (sum, item) => sum + (item.sizeBreakdown ?? []).reduce((s, e) => s + (Number(e?.quantity) || 0), 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Size &amp; Color Breakdown</h2>
        <p className="text-sm text-muted-foreground">
          Enter quantities per size for each style. Totals update automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {lineItems.map((item, index) => {
          const style = styles.find((s) => s.id === item.styleId);
          const color = colors.find((c) => c.id === item.colorId);
          return (
            <ItemBreakdownCard
              key={item.id}
              form={form}
              index={index}
              sizes={sizes}
              styleLabel={style ? `${style.styleCode} — ${style.name}` : "Select a style in the previous step"}
              colorLabel={color ? color.name : "Select a color"}
            />
          );
        })}
      </div>

      <Card className="flex items-center justify-between bg-muted/50 p-4">
        <span className="text-sm font-semibold text-foreground">Order Total</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">{grandTotal.toLocaleString()} pcs</span>
      </Card>
    </div>
  );
}
