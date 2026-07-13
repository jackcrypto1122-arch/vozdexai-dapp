"use client";

import { LuxCard, LuxCardHeader } from "@/components/ui/lux-card";
import { useMarkets } from "@/hooks/use-oraculum-data";
import { formatPercent, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const points = [38, 42, 41, 45, 49, 47, 52, 56, 54, 60, 64, 61];

export function MarketCard() {
  const { data, isLoading } = useMarkets();
  const market = data?.markets.find((row) => row.symbol === "ETH") ?? data?.markets[0];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - ((p - min) / (max - min)) * 100;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <LuxCard>
      <LuxCardHeader
        eyebrow="Market"
        title={market ? `${market.symbol} / USD` : "Featured market"}
        right={
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              (market?.change24hPct ?? 0) >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {market?.change24hPct != null ? formatPercent(market.change24hPct) : "Loading"}
          </span>
        }
      />
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl tabular-nums text-foreground">
            {isLoading ? "..." : formatUsd(market?.priceUsd)}
          </span>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-3 h-16 w-full">
          <defs>
            <linearGradient id="market-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L100,100 L0,100 Z`} fill="url(#market-fill)" />
          <path d={d} fill="none" stroke="var(--primary)" strokeWidth="1.2" />
        </svg>
      </div>
    </LuxCard>
  );
}
