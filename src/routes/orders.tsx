import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/coming-soon";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders · Oraculum" },
      { name: "description", content: "Limit orders, DCA plans and recurring swaps." },
    ],
  }),
  component: OrdersPage,
});

const orders = [
  { pair: "SOL → USDC", kind: "Limit", amount: "5 SOL @ $185", status: "Open", time: "2h" },
  {
    pair: "USDC → JUP",
    kind: "DCA",
    amount: "$50 / day · 30d",
    status: "Active",
    time: "12d left",
  },
  {
    pair: "SOL → JTO",
    kind: "Recurring",
    amount: "0.5 SOL / week",
    status: "Active",
    time: "next Mon",
  },
  {
    pair: "USDC → SOL",
    kind: "Limit",
    amount: "$1,000 @ $150",
    status: "Completed",
    time: "yesterday",
  },
  {
    pair: "SOL → WIF",
    kind: "Limit",
    amount: "3 SOL @ $2.00",
    status: "Cancelled",
    time: "3d ago",
  },
];

function OrdersPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Automation"
        title="Orders"
        subtitle="Limit, DCA and recurring — set once, executed on cue."
      />
      <Panel eyebrow="Active & recent" title="All orders">
        <ul className="divide-y divide-border/60">
          {orders.map((o, i) => (
            <li
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-foreground">{o.pair}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {o.kind}
                </p>
              </div>
              <span className="hidden sm:block text-xs text-muted-foreground truncate">
                {o.amount}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] ${
                  o.status === "Open" || o.status === "Active"
                    ? "border-primary/40 text-primary"
                    : o.status === "Completed"
                      ? "border-border/70 text-muted-foreground"
                      : "border-destructive/40 text-destructive"
                }`}
              >
                {o.status}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{o.time}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
