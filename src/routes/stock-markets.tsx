import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, StatGrid } from "@/components/layout/coming-soon";
import { useMarkets } from "@/hooks/use-oraculum-data";
import { FEATURED_TOKENS, STOCK_TOKEN_ADDRESSES } from "@/lib/constants";
import { formatPercent, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stock-markets")({
  head: () => ({
    meta: [
      { title: "Stock Market · Oraculum" },
      {
        name: "description",
        content: "Live Robinhood Chain stock-token prices for the featured stock market list.",
      },
    ],
  }),
  component: StockMarketsPage,
});

function StockMarketsPage() {
  const { data, isLoading, isError } = useMarkets();
  const stockOrder = useMemo(
    () =>
      new Map(
        STOCK_TOKEN_ADDRESSES.map((address, index) => [address.toLowerCase(), index] as const),
      ),
    [],
  );
  const stockMarkets = useMemo(
    () =>
      (data?.markets ?? [])
        .filter((market) => stockOrder.has(market.address.toLowerCase()))
        .sort(
          (left, right) =>
            (stockOrder.get(left.address.toLowerCase()) ?? Number.MAX_SAFE_INTEGER) -
            (stockOrder.get(right.address.toLowerCase()) ?? Number.MAX_SAFE_INTEGER),
        ),
    [data?.markets, stockOrder],
  );
  const gainers = useMemo(
    () =>
      [...stockMarkets].sort(
        (a, b) =>
          (b.change24hPct ?? Number.NEGATIVE_INFINITY) -
          (a.change24hPct ?? Number.NEGATIVE_INFINITY),
      ),
    [stockMarkets],
  );
  const losers = useMemo(
    () =>
      [...stockMarkets].sort(
        (a, b) =>
          (a.change24hPct ?? Number.POSITIVE_INFINITY) -
          (b.change24hPct ?? Number.POSITIVE_INFINITY),
      ),
    [stockMarkets],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ecosystem"
        title="Stock Market"
        subtitle="Live Robinhood Chain stock-token prices for AAPL, AMD, AMZN, COIN, CRWV, GOOGL, INTC, META, MSFT, MU, NVDA, ORCL, PLTR, SNDK, TSLA, and USAR."
      />
      <StatGrid
        items={[
          {
            k: "Tracked assets",
            v: String(stockMarkets.length || STOCK_TOKEN_ADDRESSES.length),
            d: "Stock tokens only",
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
        <Panel eyebrow="Price board" title="Stock tokens">
          <DataState isLoading={isLoading} isError={isError} empty={!stockMarkets.length}>
            <MarketList rows={stockMarkets} />
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
  const featuredByAddress = useMemo(
    () => new Map(FEATURED_TOKENS.map((token) => [token.address.toLowerCase(), token] as const)),
    [],
  );

  return (
    <ul className="divide-y divide-border/60">
      {rows.map((row) => {
        const featuredToken = featuredByAddress.get(row.address.toLowerCase());

        return (
          <li
            key={row.address}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border/60 bg-background/50 text-[10px]">
              {featuredToken?.logoUri ? (
                <img
                  src={featuredToken.logoUri}
                  alt={row.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                row.symbol.slice(0, 2)
              )}
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
        );
      })}
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
    return <p className="text-sm text-muted-foreground">No stock market records available yet.</p>;
  }

  return <>{children}</>;
}
