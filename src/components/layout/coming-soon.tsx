import type { ReactNode } from "react";
import { LuxCard } from "@/components/ui/lux-card";

export function StatGrid({ items }: { items: Array<{ k: string; v: string; d?: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <LuxCard key={it.k} className="px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">{it.k}</p>
          <p className="mt-0.5 font-serif text-lg tabular-nums text-foreground leading-tight">
            {it.v}
          </p>
          {it.d && <p className="mt-0.5 text-[10px] text-primary tabular-nums">{it.d}</p>}
        </LuxCard>
      ))}
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <LuxCard className={className}>
      <div className="border-b border-border/60 px-5 py-4">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
        )}
        <h3 className="font-serif text-xl text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </LuxCard>
  );
}
