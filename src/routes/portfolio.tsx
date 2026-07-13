import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatGrid, Panel } from "@/components/layout/coming-soon";
import { LuxCard } from "@/components/ui/lux-card";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio · Oraculum" },
      {
        name: "description",
        content: "Overview of your holdings, PnL, allocations and DeFi positions.",
      },
    ],
  }),
  component: PortfolioPage,
});

const holdings = [
  { sym: "SOL", amt: "24.8214", usd: "$4,182.10", pct: "48.2%", pnl: "+3.4%" },
  { sym: "USDC", amt: "1,204.10", usd: "$1,204.10", pct: "13.9%", pnl: "0.0%" },
  { sym: "JUP", amt: "812.44", usd: "$681.24", pct: "7.9%", pnl: "+12.1%" },
  { sym: "BONK", amt: "1.2M", usd: "$342.90", pct: "4.0%", pnl: "-2.7%" },
  { sym: "PYTH", amt: "540.00", usd: "$228.00", pct: "2.6%", pnl: "+6.2%" },
];

function PortfolioPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Overview"
        title="Portfolio"
        subtitle="Your holdings across chains, in one place."
      />
      <StatGrid
        items={[
          { k: "Total value", v: "$8,672.44", d: "+$284.10 24h" },
          { k: "PnL · 7d", v: "+6.24%", d: "+$512.02" },
          { k: "Assets", v: "12" },
          { k: "DeFi positions", v: "4" },
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel eyebrow="Distribution" title="Asset allocation" className="lg:col-span-2">
          <div className="flex flex-col gap-3">
            {holdings.map((h) => (
              <div key={h.sym}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="font-medium text-foreground">{h.sym}</span>
                  <span className="min-w-0 truncate text-muted-foreground text-xs">{h.amt}</span>
                  <span className="tabular-nums text-foreground">{h.usd}</span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border/60">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: h.pct }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel eyebrow="Live" title="24h performance">
          <ul className="space-y-3 text-sm">
            {holdings.map((h) => (
              <li
                key={h.sym}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
              >
                <span className="text-foreground">{h.sym}</span>
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  {h.pct} of portfolio
                </span>
                <span
                  className={
                    h.pnl.startsWith("-")
                      ? "text-destructive tabular-nums"
                      : "text-primary tabular-nums"
                  }
                >
                  {h.pnl}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <LuxCard className="mt-6 p-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          NFTs · Coming soon
        </p>
        <p className="mt-2 font-serif text-2xl text-foreground">Curate a private collection.</p>
      </LuxCard>
    </AppShell>
  );
}
