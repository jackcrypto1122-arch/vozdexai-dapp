import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LuxCard } from "@/components/ui/lux-card";
import { Panel } from "@/components/layout/coming-soon";
import { Mic, Send } from "lucide-react";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Voice AI · Oraculum" },
      {
        name: "description",
        content: "Speak to trade. The Oraculum intent engine parses, previews and executes.",
      },
    ],
  }),
  component: VoicePage,
});

const suggestions = [
  "Swap 2 SOL to USDC",
  "Buy $50 of JUP",
  "Stake 5 SOL with Marinade",
  "Bridge 0.4 ETH to Solana",
  "Send 0.5 SOL to alex.sol",
];

function VoicePage() {
  return (
    <AppShell rightRail={false}>
      <PageHeader eyebrow="Interface" title="Voice AI" subtitle="A conversation, not a form." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <LuxCard className="p-8">
          <div className="relative mx-auto grid h-56 w-56 place-items-center">
            <span className="absolute h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
            <span className="absolute h-40 w-40 rounded-full border border-primary/30 animate-pulse-ring" />
            <span
              className="absolute h-40 w-40 rounded-full border border-primary/20 animate-pulse-ring"
              style={{ animationDelay: "0.9s" }}
            />
            <div className="relative h-40 w-40 rounded-full bg-[radial-gradient(circle_at_30%_25%,oklch(0.9_0.14_152)_0%,var(--primary)_40%,oklch(0.4_0.12_152)_100%)] shadow-[0_30px_80px_-20px_var(--primary),inset_0_2px_0_rgba(255,255,255,0.4)] animate-float" />
            <Mic className="absolute h-10 w-10 text-white" strokeWidth={1.4} />
          </div>

          <div className="mt-8">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Transcript
            </p>
            <p className="mt-2 font-serif text-2xl text-foreground text-balance">
              &ldquo;Swap two SOL for USDC on the best route.&rdquo;
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <IntentField k="Action" v="Swap" />
              <IntentField k="From" v="2 SOL" />
              <IntentField k="To" v="~336.84 USDC" />
              <IntentField k="Confidence" v="98.4%" accent />
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-2">
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Type or dictate an intent…"
              />
              <button className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </LuxCard>

        <div className="space-y-6">
          <Panel eyebrow="Try saying" title="Suggestions">
            <ul className="space-y-2 text-sm">
              {suggestions.map((s) => (
                <li key={s}>
                  <button className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-foreground/85 hover:border-primary/40 hover:text-primary transition-colors">
                    &ldquo;{s}&rdquo;
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel eyebrow="Conversation" title="Recent">
            <ol className="space-y-3 text-sm">
              <li className="text-muted-foreground">
                You · <span className="text-foreground">Buy JUP with 100 USDC</span>
              </li>
              <li className="text-primary">
                Oraculum ·{" "}
                <span className="text-foreground">Route via Jupiter. 119.04 JUP. Confirm?</span>
              </li>
              <li className="text-muted-foreground">
                You · <span className="text-foreground">Confirm.</span>
              </li>
            </ol>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function IntentField({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{k}</p>
      <p className={`mt-0.5 tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{v}</p>
    </div>
  );
}
