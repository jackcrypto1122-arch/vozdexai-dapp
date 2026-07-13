import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, StatGrid } from "@/components/layout/coming-soon";
import { TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets · Oraculum" },
      { name: "description", content: "Live prices, gainers and losers across Solana." },
    ],
  }),
  component: MarketsPage,
});

type MarketRow = { sym: string; price: string; ch: string; vol: string; up: boolean };
const rows: MarketRow[] = [
  { sym: "SOL", price: "$168.42", ch: "+4.82%", vol: "$1.8B", up: true },
  { sym: "JUP", price: "$0.84", ch: "+12.10%", vol: "$182M", up: true },
  { sym: "PYTH", price: "$0.42", ch: "+6.20%", vol: "$74M", up: true },
  { sym: "WIF", price: "$2.14", ch: "-3.40%", vol: "$210M", up: false },
  { sym: "BONK", price: "$0.00003", ch: "-2.70%", vol: "$122M", up: false },
  { sym: "JTO", price: "$3.28", ch: "+1.80%", vol: "$44M", up: true },
];

function MarketsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Ecosystem"
        title="Markets"
        subtitle="Prices, flows and momentum — updated in real time."
      />
      <StatGrid
        items={[
          { k: "24h DEX volume", v: "$1.42B" },
          { k: "TVL", v: "$9.21B" },
          { k: "Stablecoin cap", v: "$4.02B" },
          { k: "Gas · Solana", v: "0.000015 SOL" },
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Momentum" title="Top gainers">
          <MarketList rows={rows.filter((r) => r.up)} />
        </Panel>
        <Panel eyebrow="Cooling" title="Top losers">
          <MarketList rows={rows.filter((r) => !r.up)} />
        </Panel>
      </div>
    </AppShell>
  );
}

function MarketList({ rows }: { rows: MarketRow[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {rows.map((r) => (
        <li
          key={r.sym}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/60 bg-background/50 text-[10px]">
            {r.sym.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate">{r.sym}</p>
            <p className="text-[11px] text-muted-foreground">Vol {r.vol}</p>
          </div>
          <span className="tabular-nums text-foreground">{r.price}</span>
          <span
            className={`inline-flex items-center gap-1 tabular-nums ${r.up ? "text-primary" : "text-destructive"}`}
          >
            {r.up ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {r.ch}
          </span>
        </li>
      ))}
    </ul>
  );
}
