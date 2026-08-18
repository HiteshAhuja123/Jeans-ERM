"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Shirt, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrderFormValues } from "@/features/orders/schema";
import type { Color, Size, Style } from "@/types";

interface StepItemsProps {
  form: UseFormReturn<OrderFormValues>;
  styles: Style[];
  colors: Color[];
  sizes: Size[];
  /** True for confirmed orders — quantities can still change in Step 4, but the style/color mix is locked. */
  locked?: boolean;
}

let itemIdCounter = 0;

export function StepItems({ form, styles, colors, sizes, locked }: StepItemsProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });

  function handleAddItem() {
    itemIdCounter += 1;
    append({
      id: `new-item-${itemIdCounter}`,
      styleId: "",
      colorId: "",
      sizeBreakdown: sizes.map((size) => ({ sizeId: size.id, quantity: 0 })),
      notes: "",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">Styles</h2>
          <p className="text-sm text-muted-foreground">Add every style and color this order includes.</p>
        </div>
        {!locked && (
          <Button type="button" variant="outline" onClick={handleAddItem}>
            <Plus /> Add Style
          </Button>
        )}
      </div>

      {locked && (
        <p className="rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-xs text-warning">
          This order is confirmed — styles and colors are locked. You can still adjust quantities in the next step.
        </p>
      )}

      {fields.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="No styles added yet"
          description="Add at least one style and color to continue."
          action={locked ? undefined : { label: "Add Style", onClick: handleAddItem }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <Card key={field.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                {!locked && fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.styleId`}
                  render={({ field: styleField }) => (
                    <FormItem>
                      <FormLabel>
                        Style <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select value={styleField.value} onValueChange={styleField.onChange} disabled={locked}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {styles.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.styleCode} — {style.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.colorId`}
                  render={({ field: colorField }) => (
                    <FormItem>
                      <FormLabel>
                        Color <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select value={colorField.value} onValueChange={colorField.onChange} disabled={locked}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colors.map((color) => (
                            <SelectItem key={color.id} value={color.id}>
                              {color.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
