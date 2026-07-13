import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/coming-soon";
import { Search, Download } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History · Oraculum" },
      { name: "description", content: "Voice commands and on-chain transactions, timelined." },
    ],
  }),
  component: HistoryPage,
});

const rows = [
  {
    day: "Today",
    items: [
      { kind: "Voice", txt: '"Swap 2 SOL to USDC"', ts: "14:22", tag: "Executed" },
      { kind: "Swap", txt: "2 SOL → 336.84 USDC", ts: "14:22", tag: "Confirmed" },
      { kind: "Voice", txt: '"Buy 100 USDC of JUP"', ts: "11:04", tag: "Executed" },
    ],
  },
  {
    day: "Yesterday",
    items: [
      { kind: "Stake", txt: "10 SOL → mSOL", ts: "22:11", tag: "Confirmed" },
      { kind: "Send", txt: "0.5 SOL → alex.sol", ts: "19:38", tag: "Confirmed" },
    ],
  },
];

function HistoryPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Timeline"
        title="History"
        subtitle="Every intent, every trade — permanently recorded."
        right={
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        }
      />
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search intents, tokens, tx hashes…"
          />
        </div>
        <div className="flex gap-2 text-[10px] uppercase tracking-[0.22em]">
          {["All", "Voice", "Swap", "Bridge", "Stake"].map((f, i) => (
            <button
              key={f}
              className={`rounded-full border px-3 py-1.5 ${i === 0 ? "border-primary/40 text-primary" : "border-border/70 text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {rows.map((day) => (
        <Panel key={day.day} eyebrow={day.day} title="Activity" className="mb-6">
          <ul className="divide-y divide-border/60">
            {day.items.map((it, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3 text-sm"
              >
                <span className="rounded-md border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {it.kind}
                </span>
                <span className="min-w-0 truncate text-foreground">{it.txt}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {it.ts} · <span className="text-primary">{it.tag}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </AppShell>
  );
}
