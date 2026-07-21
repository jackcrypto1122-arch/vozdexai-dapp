"use client";

import { useEffect, useState, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { FEATURED_TOKENS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TokenInfo } from "@/types/dapp";

export function TokenSelectField({
  label,
  value,
  excludeAddress,
  onChange,
  tokens,
  showLabel = true,
  className,
}: {
  label: string;
  value: string;
  excludeAddress?: string;
  onChange: (value: string) => void;
  tokens?: TokenInfo[];
  showLabel?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = tokens?.length ? tokens : FEATURED_TOKENS;

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const currentToken = options.find((t) => t.address.toLowerCase() === value.toLowerCase());

  const field = (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-w-40 items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-foreground shadow-sm transition-colors hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
      >
        <span className="flex items-center gap-2 truncate">
          {currentToken?.logoUri && (
            <img
              src={currentToken.logoUri}
              alt={currentToken.name}
              className="h-5 w-5 rounded-full"
            />
          )}
          {currentToken ? `${currentToken.symbol} · ${currentToken.name}` : "Select Token"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-64 max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-border/70 bg-card p-1 shadow-lg ring-1 ring-black/5">
          {options
            .filter(
              (t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase(),
            )
            .map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => {
                  onChange(token.address);
                  setOpen(false);
                }}
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <div className="flex items-center gap-3">
                  {token.logoUri && (
                    <img src={token.logoUri} alt={token.name} className="h-7 w-7 rounded-full" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                      {token.symbol}
                    </span>
                    <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary/70">
                      {token.name}
                    </span>
                  </div>
                </div>
                {value.toLowerCase() === token.address.toLowerCase() && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );

  if (!showLabel) {
    return field;
  }

  return (
    <label className="block text-sm text-muted-foreground">
      {label}
      <div className="mt-2">{field}</div>
    </label>
  );
}
