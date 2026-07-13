import { LuxCard, LuxCardHeader } from "@/components/ui/lux-card";
import { Sparkles } from "lucide-react";

export function AiInsightsCard() {
  return (
    <LuxCard>
      <LuxCardHeader
        eyebrow="Vozdex AI"
        title="Insights"
        right={<Sparkles className="h-4 w-4 text-[color:var(--gold)]" />}
      />
      <div className="px-5 pt-3 pb-5 space-y-3 text-xs">
        <Row k="Sentiment" v="Bullish" accent />
        <Row k="Recommendation" v="Rotate 15% USDC → SOL" />
        <Row k="Fear & Greed" v="72 · Greed" />
        <Row k="Gas" v="Low · 0.000015 SOL" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Trending</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["JUP", "PYTH", "WIF", "JTO", "BONK"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] tracking-wide"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </LuxCard>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{k}</span>
      <span className={`text-right truncate ${accent ? "text-primary" : "text-foreground"}`}>
        {v}
      </span>
    </div>
  );
}
