import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 mb-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground tracking-wide">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
