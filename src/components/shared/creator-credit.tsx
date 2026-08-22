import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Studio signature — consistent across every site built by AHUJA.
 * Keep markup/behavior identical if reused in other projects.
 */
export function CreatorCredit({ className }: { className?: string }) {
  return (
    <a
      href="https://hitesh-portfolio-website.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center gap-1 rounded-sm text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="font-normal text-muted-foreground transition-opacity duration-200 group-hover:opacity-80">
        Crafted by
      </span>
      <span className="font-black tracking-tighter text-foreground transition-transform duration-200 ease-out group-hover:-translate-x-px">
        AHUJA
      </span>
      <ArrowUpRight
        className="size-3 text-foreground/70 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:translate-y-[-1px]"
        aria-hidden="true"
      />
    </a>
  );
}
