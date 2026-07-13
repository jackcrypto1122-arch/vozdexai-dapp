export function ProtocolCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground px-5 py-6">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
      />
      <p className="font-serif text-xl tracking-[0.14em]">ORACULUM</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/50">
        Decentralized Voice Trading
      </p>
      <p className="mt-4 text-xs leading-relaxed text-sidebar-foreground/70">
        Built for the next financial era. Speak your intent — the protocol executes with precision.
      </p>
      <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]">
        <span className="h-px flex-1 bg-sidebar-border" />
        <span className="text-[color:var(--gold)]">v1.0 · α</span>
        <span className="h-px flex-1 bg-sidebar-border" />
      </div>
    </div>
  );
}
