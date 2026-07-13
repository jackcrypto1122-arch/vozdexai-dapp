import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { VoiceButton } from "@/components/voice/voice-button";
import { SwapCard } from "@/components/swap/swap-card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swap · Oraculum" },
      {
        name: "description",
        content:
          "Voice-first token swaps on Solana. Speak your intent, review the quote, execute with precision.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Protocol · v1.0 α"
        title="Swap Tokens"
        subtitle="Voice. Intent. Execution."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-[color:var(--gold)]" />
            Powered by Oraculum AI
          </span>
        }
      />

      <div className="mx-auto w-full max-w-3xl">
        <VoiceButton />
      </div>

      <div className="mx-auto mt-8 w-full max-w-4xl">
        <SwapCard />
      </div>
    </AppShell>
  );
}
