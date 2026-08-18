"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerFormDefaults, customerFormSchema, type CustomerFormValues } from "@/features/customers/schema";
import { customerHooks } from "@/features/customers/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { Customer } from "@/types";

interface CustomerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  existingCustomers: Customer[];
}

const typeOptions: Array<{ value: CustomerFormValues["type"]; label: string }> = [
  { value: "brand", label: "Brand" },
  { value: "retailer", label: "Retailer" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "individual", label: "Individual" },
];

export function CustomerFormSheet({ open, onOpenChange, customer, existingCustomers }: CustomerFormSheetProps) {
  const createMutation = customerHooks.useCreate();
  const updateMutation = customerHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customerFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      customer
        ? {
            code: customer.code,
            name: customer.name,
            type: customer.type,
            contactPerson: customer.contactPerson,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            country: customer.country,
            status: customer.status,
            notes: customer.notes ?? "",
          }
        : customerFormDefaults,
    );
  }, [open, customer, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingCustomers, values.code, customer?.id)) {
      form.setError("code", { message: "A customer with this code already exists" });
      return;
    }
    const patch = {
      ...values,
      location: `${values.city}, ${values.country}`,
      activeOrders: customer?.activeOrders ?? 0,
      totalOrders: customer?.totalOrders ?? 0,
    };
    try {
      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, patch });
        toast.success(`Customer "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(patch);
        toast.success(`Customer "${values.name}" added`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={customer ? "Edit Customer" : "Add Customer"}
      description="Brands, retailers, wholesalers and individual business customers."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Identification</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Customer Code <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. CUST-007" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Customer Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Urban Denim Co." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact</p>
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contact Person <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Michael Carter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="+1 212 555 0148" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Address</p>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="Street, building" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  City <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. New York" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Country <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. USA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Anything the team should know about this customer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </EntityFormSheet>
  );
}
