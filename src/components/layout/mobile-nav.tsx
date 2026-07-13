"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VozdexLogo } from "@/components/brand/vozdex-logo";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const items = navItems.slice(0, 5);
  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 z-40 rounded-2xl border border-sidebar-border bg-sidebar/95 backdrop-blur px-2 py-2 shadow-2xl">
      <div className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2">
        <VozdexLogo className="h-7 w-7 shrink-0" />
        <span className="text-[10px] uppercase tracking-[0.28em] text-sidebar-foreground/75">
          Vozdex AI
        </span>
      </div>
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                href={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
