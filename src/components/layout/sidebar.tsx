"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { VozdexLogo } from "@/components/brand/vozdex-logo";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useMarkets } from "@/hooks/use-oraculum-data";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 pt-8 pb-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex items-center justify-center">
            <VozdexLogo className="h-14 w-14 shrink-0" />
          </div>
          <div>
            <span className="block font-sans text-2xl tracking-[0.18em] text-sidebar-foreground">
              VOZDEX AI
            </span>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-sidebar-foreground/50">
              Voice Trading Terminal
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/40">
          Protocol
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to} className="relative">
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-primary/15 ring-1 ring-primary/30"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Link
                  href={item.to}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "text-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                  <span className="tracking-wide">{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_16px_rgba(200,255,0,0.65)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4">
        <ConnectButton />
      </div>

      <TerminalCard />
    </aside>
  );
}

function TerminalCard() {
  const { address, isConnected } = useAccount();
  const { data } = useMarkets();
  const network = data?.network as
    { blockNumber?: number; network?: string; rpcUrl?: string } | undefined;

  return (
    <div className="m-4 rounded-2xl border border-sidebar-border bg-black/40 p-4 font-mono text-[10.5px] leading-relaxed text-sidebar-foreground/80">
      <div className="flex items-center justify-between">
        <span className="uppercase tracking-[0.24em] text-sidebar-foreground/50">Terminal</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-primary">{isConnected ? "connected" : "standby"}</span>
        </span>
      </div>

      <div className="my-3 flex justify-center">
        <WireGlobe />
      </div>

      <dl className="space-y-1">
        <Row
          k="wallet"
          v={address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "not connected"}
        />
        <Row k="rpc" v={network?.rpcUrl?.includes("robinhood") ? "robinhood" : "custom"} />
        <Row k="network" v={network?.network ?? "robinhood"} />
        <Row k="block" v={network?.blockNumber?.toLocaleString() ?? "..."} />
      </dl>

      <div className="mt-3 flex items-center gap-1 text-primary">
        <span>{">"}</span>
        <span className="text-sidebar-foreground/70">listen --voice</span>
        <span className="ml-0.5 inline-block h-3 w-1.5 bg-primary animate-blink" />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sidebar-foreground/40">{k}</dt>
      <dd className="tabular-nums text-sidebar-foreground/85">{v}</dd>
    </div>
  );
}

function WireGlobe() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-20 w-20 text-primary/70 animate-spin-slow"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
    >
      <circle cx="50" cy="50" r="38" />
      <ellipse cx="50" cy="50" rx="38" ry="15" />
      <ellipse cx="50" cy="50" rx="38" ry="28" />
      <ellipse cx="50" cy="50" rx="15" ry="38" />
      <ellipse cx="50" cy="50" rx="28" ry="38" />
      <line x1="12" y1="50" x2="88" y2="50" />
      <line x1="50" y1="12" x2="50" y2="88" />
    </svg>
  );
}
