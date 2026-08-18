import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { MobileMenuTrigger } from "@/components/shell/mobile-nav-sheet";
import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { UserMenu } from "@/components/shell/user-menu";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <MobileMenuTrigger />

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search orders, styles, customers…"
          className="pl-9"
          aria-label="Search"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        <NotificationsMenu />
        <div className="hidden sm:block">
          <UserMenu variant="topbar" />
        </div>
      </div>
    </header>
  );
}
