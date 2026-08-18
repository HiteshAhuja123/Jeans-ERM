import {
  CommandPaletteDesktopTrigger,
  CommandPaletteMobileTrigger,
} from "@/components/shell/command-palette";
import { MobileMenuTrigger } from "@/components/shell/mobile-nav-sheet";
import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { UserMenu } from "@/components/shell/user-menu";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <MobileMenuTrigger />

      <div className="hidden flex-1 sm:flex">
        <CommandPaletteDesktopTrigger />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:flex-none">
        <div className="sm:hidden">
          <CommandPaletteMobileTrigger />
        </div>
        <NotificationsMenu />
        <div className="hidden sm:block">
          <UserMenu variant="topbar" />
        </div>
      </div>
    </header>
  );
}
