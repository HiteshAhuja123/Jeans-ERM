"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { Check, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { generateOrderNumber, getOrderEditTier } from "@/lib/order-utils";
import { orderFormSchema, type OrderFormValues } from "@/features/orders/schema";
import { orderHooks } from "@/features/orders/service";
import { customerHooks } from "@/features/customers/service";
import { styleHooks } from "@/features/styles/service";
import { colorHooks } from "@/features/colors/service";
import { sizeHooks } from "@/features/sizes/service";
import { StepCustomer } from "@/features/orders/wizard/step-customer";
import { StepOrderInfo } from "@/features/orders/wizard/step-order-info";
import { StepItems } from "@/features/orders/wizard/step-items";
import { StepBreakdown } from "@/features/orders/wizard/step-breakdown";
import { StepDelivery } from "@/features/orders/wizard/step-delivery";
import { StepReview } from "@/features/orders/wizard/step-review";
import type { Order } from "@/types";

const steps = [
  { key: "customer", label: "Customer" },
  { key: "info", label: "Order Info" },
  { key: "items", label: "Styles" },
  { key: "breakdown", label: "Breakdown" },
  { key: "delivery", label: "Delivery" },
  { key: "review", label: "Review" },
] as const;

type StepKey = (typeof steps)[number]["key"];

const stepFields: Record<StepKey, Array<keyof OrderFormValues>> = {
  customer: ["customerId"],
  info: ["orderNumber", "orderDate", "dueDate", "priority"],
  items: ["lineItems"],
  breakdown: ["lineItems"],
  delivery: [],
  review: [],
};

function firstErrorStepIndex(errors: FieldErrors<OrderFormValues>): number {
  if (errors.customerId) return 0;
  if (errors.orderNumber || errors.orderDate || errors.dueDate || errors.priority) return 1;
  if (errors.lineItems) {
    if (Array.isArray(errors.lineItems)) {
      const hasStyleOrColorError = errors.lineItems.some((entry) => entry?.styleId || entry?.colorId);
      return hasStyleOrColorError ? 2 : 3;
    }
    return 2;
  }
  return steps.length - 1;
}

function orderToFormValues(order: Order): OrderFormValues {
  return {
    customerId: order.customerId,
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    dueDate: order.dueDate,
    priority: order.priority,
    customerReference: order.customerReference ?? "",
    notes: order.notes ?? "",
    internalNotes: order.internalNotes ?? "",
    deliveryLocation: order.deliveryLocation ?? "",
    shippingInstructions: order.shippingInstructions ?? "",
    lineItems: order.lineItems.map((li) => ({
      id: li.id,
      styleId: li.styleId,
      colorId: li.colorId,
      sizeBreakdown: li.sizeBreakdown.map((sb) => ({ sizeId: sb.sizeId, quantity: sb.quantity })),
      notes: li.notes ?? "",
    })),
  };
}

interface OrderWizardProps {
  mode: "create" | "edit";
  order?: Order;
}

export function OrderWizard({ mode, order }: OrderWizardProps) {
  const router = useRouter();
  const { data: customers = [] } = customerHooks.useList();
  const { data: allStyles = [] } = styleHooks.useList();
  const { data: allColors = [] } = colorHooks.useList();
  const { data: allSizes = [] } = sizeHooks.useList();
  const { data: existingOrders = [] } = orderHooks.useList();
  const createMutation = orderHooks.useCreate();
  const updateMutation = orderHooks.useUpdate();

  const styles = useMemo(() => allStyles.filter((s) => s.status === "active"), [allStyles]);
  const colors = useMemo(() => allColors.filter((c) => c.status === "active"), [allColors]);
  const sizes = useMemo(
    () => [...allSizes].filter((s) => s.status === "active").sort((a, b) => a.sequence - b.sequence),
    [allSizes],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex].key;

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: order
      ? orderToFormValues(order)
      : {
          customerId: "",
          orderNumber: generateOrderNumber(existingOrders),
          orderDate: new Date().toISOString().slice(0, 10),
          dueDate: "",
          priority: "normal",
          customerReference: "",
          notes: "",
          internalNotes: "",
          deliveryLocation: "",
          shippingInstructions: "",
          lineItems: [],
        },
  });

  useEffect(() => {
    if (mode === "create" && existingOrders.length > 0 && !form.formState.isDirty) {
      form.setValue("orderNumber", generateOrderNumber(existingOrders));
    }
    // Only re-run when the order list itself changes; re-triggering on every keystroke would overwrite user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingOrders.length]);

  const selectedCustomerId = useWatch({ control: form.control, name: "customerId" });
  const editTier = order ? getOrderEditTier(order.status) : "full";
  const itemsLocked = editTier === "limited";

  if (mode === "edit" && order && (editTier === "very_limited" || editTier === "readonly")) {
    return (
      <EmptyState
        icon={Lock}
        title="This order can't be edited here"
        description={
          editTier === "readonly"
            ? "This order is read-only because of its current status."
            : "Orders in production only allow delivery and note changes — use Edit on the order detail page."
        }
        action={{ label: "Back to Order", onClick: () => router.push(`/orders/${order.id}`) }}
      />
    );
  }

  /**
   * The "Styles" step only needs style/color chosen — quantities aren't entered until the
   * "Breakdown" step right after it, so validating the full `lineItems` schema (which also
   * requires each item's size total to be > 0) here would make it impossible to ever advance.
   */
  function validateItemsStep(): boolean {
    const items = form.getValues("lineItems");
    if (items.length === 0) {
      form.setError("lineItems", { type: "manual", message: "Add at least one style to the order" });
      return false;
    }

    let hasError = false;
    const seenCombos = new Set<string>();
    items.forEach((item, index) => {
      if (!item.styleId) {
        form.setError(`lineItems.${index}.styleId`, { type: "manual", message: "Select a style" });
        hasError = true;
      }
      if (!item.colorId) {
        form.setError(`lineItems.${index}.colorId`, { type: "manual", message: "Select a color" });
        hasError = true;
      }
      if (item.styleId && item.colorId) {
        const combo = `${item.styleId}:${item.colorId}`;
        if (seenCombos.has(combo)) {
          form.setError(`lineItems.${index}.colorId`, {
            type: "manual",
            message: "This style and color are already on the order.",
          });
          hasError = true;
        }
        seenCombos.add(combo);
      }
    });
    return !hasError;
  }

  async function goNext() {
    const fields = stepFields[currentStep];
    const valid =
      currentStep === "items" ? validateItemsStep() : fields.length === 0 ? true : await form.trigger(fields);
    if (!valid) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    if (stepIndex === 0) {
      router.push(mode === "edit" && order ? `/orders/${order.id}` : "/orders");
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function buildOrderPayload(values: OrderFormValues, status: Order["status"]): Omit<Order, "id"> {
    const customer = customers.find((c) => c.id === values.customerId);
    const lineItems = values.lineItems.map((li, index) => {
      const style = styles.find((s) => s.id === li.styleId) ?? allStyles.find((s) => s.id === li.styleId);
      const color = colors.find((c) => c.id === li.colorId) ?? allColors.find((c) => c.id === li.colorId);
      const sizeBreakdown = li.sizeBreakdown.filter((sb) => sb.quantity > 0);
      return {
        id: li.id.startsWith("new-item-") ? `${values.orderNumber}-li-${index + 1}` : li.id,
        styleId: li.styleId,
        styleCode: style?.styleCode ?? "",
        styleName: style?.name ?? "",
        colorId: li.colorId,
        colorName: color?.name ?? "",
        sizeBreakdown,
        quantity: sizeBreakdown.reduce((sum, sb) => sum + sb.quantity, 0),
        unit: "pcs",
        notes: li.notes || undefined,
      };
    });
    const quantity = lineItems.reduce((sum, li) => sum + li.quantity, 0);
    const previousProduced = order?.quantityProduced ?? 0;

    return {
      orderNumber: values.orderNumber,
      customerId: values.customerId,
      customerName: customer?.name ?? order?.customerName ?? "",
      customerReference: values.customerReference || undefined,
      orderDate: values.orderDate,
      dueDate: values.dueDate,
      priority: values.priority,
      status,
      lineItems,
      quantity,
      quantityProduced: Math.min(previousProduced, quantity),
      currentStage: order?.currentStage ?? "cutting",
      isDelayed: order?.isDelayed ?? false,
      deliveryLocation: values.deliveryLocation || undefined,
      shippingInstructions: values.shippingInstructions || undefined,
      notes: values.notes || undefined,
      internalNotes: values.internalNotes || undefined,
    };
  }

  async function handleSave(status: Order["status"]) {
    const valid = status === "draft" ? await form.trigger(["customerId"]) : await form.trigger();
    if (!valid) {
      if (status !== "draft") {
        setStepIndex(firstErrorStepIndex(form.formState.errors));
        toast.error("Please fix the highlighted fields before continuing.");
      }
      return;
    }

    const payload = buildOrderPayload(form.getValues(), status);

    try {
      if (mode === "edit" && order) {
        const updated = await updateMutation.mutateAsync({ id: order.id, patch: payload });
        toast.success(`Order ${updated.orderNumber} updated`);
        router.push(`/orders/${order.id}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success(`Order ${created.orderNumber} ${status === "draft" ? "saved as draft" : "created"}`);
        router.push(`/orders/${created.id}`);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={mode === "edit" ? `Edit ${order?.orderNumber}` : "New Order"}
        description={mode === "edit" ? "Update this order's details." : "Create a customer order in a few steps."}
      />

      <ol className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const state = index === stepIndex ? "current" : index < stepIndex ? "done" : "upcoming";
          return (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => index < stepIndex && setStepIndex(index)}
                disabled={index >= stepIndex}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  state === "current" && "border-primary bg-primary/10 text-primary",
                  state === "done" && "cursor-pointer border-success/30 bg-success-subtle text-success",
                  state === "upcoming" && "border-border text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3.5" aria-hidden="true" /> : <span>{index + 1}</span>}
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>

      <Card className="p-4 sm:p-6">
        <Form {...form}>
          {currentStep === "customer" && (
            <StepCustomer
              customerId={selectedCustomerId}
              onSelect={(customer) =>
                form.setValue("customerId", customer.id, { shouldValidate: true, shouldDirty: true })
              }
            />
          )}
          {currentStep === "info" && <StepOrderInfo form={form} />}
          {currentStep === "items" && (
            <StepItems form={form} styles={styles} colors={colors} sizes={sizes} locked={itemsLocked} />
          )}
          {currentStep === "breakdown" && <StepBreakdown form={form} styles={styles} colors={colors} sizes={sizes} />}
          {currentStep === "delivery" && <StepDelivery form={form} />}
          {currentStep === "review" && (
            <StepReview form={form} customers={customers} styles={styles} colors={colors} sizes={sizes} />
          )}
        </Form>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
          {stepIndex === 0 ? "Cancel" : "Back"}
        </Button>
        <div className="flex items-center gap-2">
          {isLastStep ? (
            <>
              {mode === "create" && (
                <Button type="button" variant="secondary" onClick={() => handleSave("draft")} disabled={isSubmitting}>
                  Save Draft
                </Button>
              )}
              <Button
                type="button"
                onClick={() => handleSave(mode === "edit" && order ? order.status : "confirmed")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Order"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
