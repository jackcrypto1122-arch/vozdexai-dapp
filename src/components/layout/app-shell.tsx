import type { ReactNode } from "react";
import { AppSidebar } from "./sidebar";
import { RightRail } from "./right-rail";
import { MobileNav } from "./mobile-nav";

export function AppShell({
  children,
  rightRail = true,
}: {
  children: ReactNode;
  rightRail?: boolean;
}) {
  return (
    <div className="min-h-dvh flex w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-3 lg:py-4 pb-24 lg:pb-4">
          {children}
        </div>
        {rightRail && (
          <div className="hidden xl:block w-80 shrink-0 border-l border-border/60 bg-background/60">
            <RightRail />
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
