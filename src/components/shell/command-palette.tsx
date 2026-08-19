"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Package, PackageSearch, Search, ShoppingCart } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { allNavItems } from "@/lib/navigation";
import { mockCustomers, mockMaterials, mockOrders, mockPurchaseOrders, mockSuppliers } from "@/mock-data";

interface PaletteResult {
  id: string;
  group: string;
  label: string;
  description?: string;
  href: string;
  icon: typeof Search;
}

const pageResults: PaletteResult[] = allNavItems.map((item) => ({
  id: `page-${item.href}`,
  group: "Pages",
  label: item.label,
  description: item.description,
  href: item.href,
  icon: item.icon,
}));

const orderResults: PaletteResult[] = mockOrders.map((order) => ({
  id: `order-${order.id}`,
  group: "Orders",
  label: order.orderNumber,
  description: `${order.customerName} · ${order.lineItems.map((li) => li.styleCode).join(", ")}`,
  href: `/orders/${order.id}`,
  icon: Package,
}));

const customerResults: PaletteResult[] = mockCustomers.map((customer) => ({
  id: `customer-${customer.id}`,
  group: "Customers",
  label: customer.name,
  description: `${customer.location} · ${customer.activeOrders} active orders`,
  href: `/orders?q=${encodeURIComponent(customer.name)}`,
  icon: Building2,
}));

const inventoryResults: PaletteResult[] = mockMaterials
  .filter((material) => material.status === "active")
  .map((material) => ({
    id: `inventory-${material.id}`,
    group: "Inventory",
    label: material.name,
    description: material.code,
    href: `/inventory/stock/${material.id}`,
    icon: PackageSearch,
  }));

const supplierResults: PaletteResult[] = mockSuppliers.map((supplier) => ({
  id: `supplier-${supplier.id}`,
  group: "Suppliers",
  label: supplier.name,
  description: supplier.location,
  href: `/masters/suppliers/${supplier.id}`,
  icon: Building2,
}));

const purchaseOrderResults: PaletteResult[] = mockPurchaseOrders.map((po) => ({
  id: `po-${po.id}`,
  group: "Purchasing",
  label: po.poNumber,
  description: po.supplierName,
  href: `/purchasing/orders/${po.id}`,
  icon: ShoppingCart,
}));

const groupedResults: Array<{ group: string; items: PaletteResult[] }> = [
  { group: "Pages", items: pageResults },
  { group: "Orders", items: orderResults },
  { group: "Customers", items: customerResults },
  { group: "Inventory", items: inventoryResults },
  { group: "Purchasing", items: purchaseOrderResults },
  { group: "Suppliers", items: supplierResults },
];

const CommandPaletteContext = createContext<{ open: () => void } | null>(null);

function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandPaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search pages, orders, customers and inventory"
      >
        <CommandInput placeholder="Search pages, orders, customers, inventory…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groupedResults.map(({ group, items }) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.description ?? ""}`}
                    onSelect={() => go(item.href)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{item.label}</span>
                      {item.description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteDesktopTrigger() {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      className="flex h-9 max-w-sm flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">Search orders, styles, customers…</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}

export function CommandPaletteMobileTrigger() {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open search"
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
    >
      <Search className="size-5" aria-hidden="true" />
    </button>
  );
}
