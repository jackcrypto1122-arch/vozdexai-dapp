import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, StatGrid } from "@/components/layout/coming-soon";
import { useMarkets } from "@/hooks/use-oraculum-data";
import { FEATURED_TOKENS, STOCK_TOKEN_ADDRESSES } from "@/lib/constants";
import { formatPercent, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Crypto Market · Oraculum" },
      {
        name: "description",
        content: "Live Robinhood Chain crypto market prices, gainers, and losers.",
      },
    ],
  }),
  component: MarketsPage,
});

function MarketsPage() {
  const { data, isLoading, isError } = useMarkets();
  const stockAddressSet = useMemo(
    () => new Set(STOCK_TOKEN_ADDRESSES.map((address) => address.toLowerCase())),
    [],
  );
  const cryptoMarkets = useMemo(
    () =>
      (data?.markets ?? []).filter((market) => !stockAddressSet.has(market.address.toLowerCase())),
    [data?.markets, stockAddressSet],
  );
  const gainers = useMemo(
    () =>
      [...cryptoMarkets].sort(
        (a, b) =>
          (b.change24hPct ?? Number.NEGATIVE_INFINITY) -
          (a.change24hPct ?? Number.NEGATIVE_INFINITY),
      ),
    [cryptoMarkets],
  );
  const losers = useMemo(
    () =>
      [...cryptoMarkets].sort(
        (a, b) =>
          (a.change24hPct ?? Number.POSITIVE_INFINITY) -
          (b.change24hPct ?? Number.POSITIVE_INFINITY),
      ),
    [cryptoMarkets],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ecosystem"
        title="Crypto Market"
        subtitle="Live Robinhood Chain crypto prices, liquidity, and momentum without the stock tokens."
      />
      <StatGrid
        items={[
          {
            k: "Tracked assets",
            v: String(
              cryptoMarkets.length || FEATURED_TOKENS.length - STOCK_TOKEN_ADDRESSES.length,
            ),
            d: "Crypto tokens only",
          },
          {
            k: "Top gainer",
            v: gainers[0]?.symbol ?? "N/A",
            d: formatPercent(gainers[0]?.change24hPct),
          },
          {
            k: "Top loser",
            v: losers[0]?.symbol ?? "N/A",
            d: formatPercent(losers[0]?.change24hPct),
          },
        ]}
      />

      <div className="mt-6">
        <Panel eyebrow="Price board" title="Crypto tokens">
          <DataState isLoading={isLoading} isError={isError} empty={!cryptoMarkets.length}>
            <MarketList rows={cryptoMarkets} />
          </DataState>
        </Panel>
      </div>
    </AppShell>
  );
}

function MarketList({
  rows,
}: {
  rows: Array<{
    address: string;
    symbol: string;
    name: string;
    priceUsd?: number | null;
    volume24hUsd?: number | null;
    change24hPct?: number | null;
  }>;
}) {
  return (
    <ul className="divide-y divide-border/60">
      {rows.map((row) => (
        <li
          key={row.address}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/60 bg-background/50 text-[10px]">
            {row.symbol.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-foreground">{row.symbol}</p>
            <p className="truncate text-[11px] text-muted-foreground">{row.name}</p>
          </div>
          <div className="text-right">
            <p className="tabular-nums text-foreground">{formatUsd(row.priceUsd)}</p>
            <p className="text-[11px] text-muted-foreground">Vol {formatUsd(row.volume24hUsd)}</p>
          </div>
          <span
            className={cn(
              "tabular-nums",
              (row.change24hPct ?? 0) >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {formatPercent(row.change24hPct)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DataState({
  isLoading,
  isError,
  empty,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading live data...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load data right now.</p>;
  }

  if (empty) {
    return <p className="text-sm text-muted-foreground">No crypto market records available yet.</p>;
  }

  return <>{children}</>;
}
