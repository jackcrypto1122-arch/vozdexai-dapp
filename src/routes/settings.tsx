import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/coming-soon";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Oraculum" },
      { name: "description", content: "Wallet, RPC, voice and privacy preferences." },
    ],
  }),
  component: SettingsPage,
});

const groups: Array<{ title: string; rows: Array<{ k: string; v: string }> }> = [
  {
    title: "Wallet",
    rows: [
      { k: "Connected", v: "Phantom · 7fA9…c2Kd" },
      { k: "Auto-approve", v: "≤ $50" },
    ],
  },
  {
    title: "Network",
    rows: [
      { k: "RPC", v: "mainnet-α (Helius)" },
      { k: "Priority fee", v: "Auto" },
    ],
  },
  {
    title: "Voice",
    rows: [
      { k: "Language", v: "English (US)" },
      { k: "Wake word", v: '"Oraculum"' },
    ],
  },
  {
    title: "Notifications",
    rows: [
      { k: "Fills", v: "Push + email" },
      { k: "Digest", v: "Weekly" },
    ],
  },
  {
    title: "Privacy",
    rows: [
      { k: "Analytics", v: "Anonymous" },
      { k: "Telemetry", v: "Off" },
    ],
  },
  {
    title: "Appearance",
    rows: [
      { k: "Theme", v: "Cream · Editorial" },
      { k: "Density", v: "Comfortable" },
    ],
  },
];

function SettingsPage() {
  return (
    <AppShell rightRail={false}>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        subtitle="Tune the protocol to your rhythm."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.title} eyebrow="Section" title={g.title}>
            <ul className="divide-y divide-border/60">
              {g.rows.map((r) => (
                <li
                  key={r.k}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm"
                >
                  <span className="text-muted-foreground">{r.k}</span>
                  <span className="text-foreground truncate max-w-[220px]">{r.v}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
