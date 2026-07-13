"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/hooks/use-oraculum-data";
import { formatAmount, formatUsd, shortAddress } from "@/lib/format";
import { LuxCard, LuxCardHeader } from "@/components/ui/lux-card";
import { DEFAULT_EXPLORER } from "@/lib/constants";

export function WalletCard() {
  const { address, isConnected } = useAccount();
  const walletAddress = address;
  const { data } = usePortfolio(walletAddress);
  const topHoldings = data?.holdings.slice(0, 4) ?? [];

  const copyAddress = async () => {
    if (!walletAddress) {
      return;
    }
    await navigator.clipboard.writeText(walletAddress);
    toast.success("Wallet address copied.");
  };

  return (
    <LuxCard className="overflow-hidden">
      <LuxCardHeader
        eyebrow="Wallet"
        title={isConnected ? "Vozdex AI Wallet" : "Connect Wallet"}
        right={
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {isConnected ? "live" : "ready"}
          </span>
        }
      />
      <div className="px-5 pt-3 pb-4">
        {isConnected ? (
          <>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
              <code className="text-xs tracking-wide text-foreground/80 truncate">
                {shortAddress(walletAddress)}
              </code>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button type="button" onClick={copyAddress} aria-label="Copy wallet address">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <a
                  href={`${DEFAULT_EXPLORER}/address/${walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open wallet on block explorer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {topHoldings.map((holding) => (
                <Balance
                  key={holding.address}
                  sym={holding.symbol}
                  amt={formatAmount(holding.amountUi)}
                  fiat={formatUsd(holding.usdValue)}
                />
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Portfolio Value
              </p>
              <p className="mt-1 font-sans text-2xl">{formatUsd(data?.totalUsdValue)}</p>
            </div>

            <Link
              href="/portfolio"
              className="mt-4 block w-full rounded-xl border border-border/70 bg-background/60 py-2 text-center text-xs uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:bg-background"
            >
              Open Portfolio
            </Link>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Connect Rainbow Wallet, MetaMask, or Coinbase Wallet to load live balances, quotes,
              and transaction history.
            </p>
            <ConnectButton />
          </div>
        )}
      </div>
    </LuxCard>
  );
}

function Balance({ sym, amt, fiat }: { sym: string; amt: string; fiat: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{sym}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">{amt}</p>
      <p className="text-[11px] tabular-nums text-muted-foreground">{fiat}</p>
    </div>
  );
}
