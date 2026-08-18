"use client";

import { useMemo, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomerFormSheet } from "@/features/customers/customer-form-sheet";
import { customerHooks } from "@/features/customers/service";
import { activeStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types";

interface StepCustomerProps {
  customerId: string;
  onSelect: (customer: Customer) => void;
}

export function StepCustomer({ customerId, onSelect }: StepCustomerProps) {
  const { data: customers = [], isLoading } = customerHooks.useList();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const selected = customers.find((c) => c.id === customerId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Customer</h2>
        <p className="text-sm text-muted-foreground">Choose who this order is for.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, code or location…"
            className="pl-9"
            aria-label="Search customers"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => setSheetOpen(true)}>
          <Plus /> New Customer
        </Button>
      </div>

      {selected && (
        <Card className="flex flex-col gap-1 border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">{selected.name}</span>
            <StatusBadge
              label={activeStatusMeta[selected.status].label}
              level={activeStatusMeta[selected.status].level}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {selected.code} · {selected.contactPerson} · {selected.location}
          </span>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading customers…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No customers found"
          description="Try a different search term, or add a new customer."
        />
      ) : (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-0.5">
          {filtered.map((customer) => {
            const isSelected = customer.id === customerId;
            const meta = activeStatusMeta[customer.status];
            return (
              <button
                type="button"
                key={customer.id}
                onClick={() => onSelect(customer)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                )}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{customer.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {customer.code} · {customer.contactPerson} · {customer.location}
                  </span>
                </div>
                <StatusBadge label={meta.label} level={meta.level} hideIcon className="shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <CustomerFormSheet open={sheetOpen} onOpenChange={setSheetOpen} existingCustomers={customers} />
    </div>
  );
}
