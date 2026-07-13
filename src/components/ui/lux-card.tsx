import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function LuxCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_20px_40px_-30px_rgba(0,0,0,0.15)]",
        className,
      )}
      {...props}
    />
  );
}

export function LuxCardHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pt-5">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[9.5px] uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h3 className="font-serif text-lg leading-tight text-foreground truncate">{title}</h3>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
