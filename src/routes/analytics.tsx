import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatGrid, Panel } from "@/components/layout/coming-soon";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Oraculum" },
      { name: "description", content: "Trading performance, PnL and protocol usage analytics." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const series = [12, 14, 18, 16, 20, 24, 22, 26, 30, 34, 32, 38, 42, 40, 46, 52, 50, 58, 62, 66];
  const max = Math.max(...series);
  const min = Math.min(...series);
  const d = series
    .map((p, i) => {
      const x = (i / (series.length - 1)) * 100;
      const y = 100 - ((p - min) / (max - min)) * 100;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <AppShell rightRail={false}>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        subtitle="A quiet dashboard for signal, not noise."
      />
      <StatGrid
        items={[
          { k: "PnL · 30d", v: "+18.42%", d: "+$1,204.10" },
          { k: "Trades executed", v: "142" },
          { k: "Volume", v: "$28,441" },
          { k: "Win rate", v: "64.2%" },
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel eyebrow="Cumulative" title="Portfolio value · 30d" className="lg:col-span-2">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-56 w-full">
            <defs>
              <linearGradient id="pnl-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${d} L100,100 L0,100 Z`} fill="url(#pnl-fill)" />
            <path d={d} fill="none" stroke="var(--primary)" strokeWidth="1" />
          </svg>
        </Panel>
        <Panel eyebrow="Breakdown" title="By protocol">
          <ul className="space-y-3 text-sm">
            {[
              { p: "Jupiter", v: "62%" },
              { p: "Orca", v: "18%" },
              { p: "Raydium", v: "12%" },
              { p: "Meteora", v: "8%" },
            ].map((row) => (
              <li key={row.p}>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">{row.p}</span>
                  <span className="tabular-nums text-muted-foreground">{row.v}</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/60">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: row.v }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
