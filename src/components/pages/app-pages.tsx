"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  AudioLines,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Mic,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, StatGrid } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { SwapCard } from "@/components/swap/swap-card";
import { TokenSelectField } from "@/components/token/token-select-field";
import { VoiceButton } from "@/components/voice/voice-button";
import { LuxCard } from "@/components/ui/lux-card";
import { useTokenOptions } from "@/hooks/use-token-options";
import { useHistory, useMarkets, usePortfolio } from "@/hooks/use-oraculum-data";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { FEATURED_TOKENS, STOCK_TOKEN_ADDRESSES, SYMBOL_TO_ADDRESS } from "@/lib/constants";
import { formatAmount, formatPercent, formatTime, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOraculumStore } from "@/store/oraculum-store";
import type { HistoryItem, VoiceIntent } from "@/types/dapp";

function shortAddress(address?: string | null) {
  if (!address) return "not connected";
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function SwapHomePage() {
  const { address: walletAddress, isConnected } = useAccount();
  const { data: portfolio } = usePortfolio(walletAddress);
  const { data: marketPayload } = useMarkets();
  const markets = marketPayload?.markets ?? [];
  const topMover = portfolio?.topMovers[0];
  const ethMarket = markets.find((market) => market.symbol === "ETH") ?? markets[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Protocol · v1.0 α"
        title="Swap Tokens"
        subtitle="Vozdex AI brings live Robinhood Chain routing, wallet-aware execution, and voice-assisted intent capture into one terminal."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {isConnected ? `Wallet ${shortAddress(walletAddress)}` : "Connect wallet to trade"}
          </span>
        }
      />

      <StatGrid
        items={[
          {
            k: "Portfolio",
            v: isConnected ? formatUsd(portfolio?.totalUsdValue) : "Connect",
            d: isConnected
              ? `${portfolio?.holdings.length ?? 0} live holdings`
              : "MetaMask, WalletConnect, etc.",
          },
          {
            k: "ETH spot",
            v: ethMarket?.priceUsd != null ? formatUsd(ethMarket.priceUsd) : "N/A",
            d:
              ethMarket?.change24hPct != null
                ? formatPercent(ethMarket.change24hPct)
                : "Market feed standby",
          },
          {
            k: "Top mover",
            v: topMover?.symbol ?? "Waiting",
            d:
              topMover?.change24hPct != null
                ? formatPercent(topMover.change24hPct)
                : "Connect wallet for movers",
          },
          {
            k: "Tracked pairs",
            v: String(markets.length || FEATURED_TOKENS.length),
            d: "Uniswap-style router",
          },
        ]}
      />

      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="w-full max-w-3xl">
          <VoiceButton />
        </div>

        <div className="w-full max-w-2xl">
          <SwapCard />
        </div>
      </div>
    </AppShell>
  );
}

export function PortfolioRoutePage() {
  const { address: walletAddress, isConnected } = useAccount();
  const { data: portfolio, isLoading, isError } = usePortfolio(walletAddress);
  const holdings = portfolio?.holdings ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Overview"
        title="Portfolio"
        subtitle="Live holdings, valuations, and 24h movers for the connected wallet."
      />

      {!isConnected ? (
        <EmptyState
          title="Connect a wallet to load your portfolio."
          description="Once connected, Vozdex AI reads native ETH, ERC-20 balances, live market pricing, and recent performance."
        />
      ) : (
        <>
          <StatGrid
            items={[
              {
                k: "Total value",
                v: formatUsd(portfolio?.totalUsdValue),
                d: `${holdings.length} tracked assets`,
              },
              {
                k: "Top holding",
                v: holdings[0]?.symbol ?? "N/A",
                d: formatUsd(holdings[0]?.usdValue),
              },
              {
                k: "Largest mover",
                v: portfolio?.topMovers[0]?.symbol ?? "N/A",
                d:
                  portfolio?.topMovers[0]?.change24hPct != null
                    ? formatPercent(portfolio.topMovers[0].change24hPct)
                    : "No change data",
              },
              {
                k: "Wallet",
                v: shortAddress(walletAddress),
                d: "Robinhood Chain mainnet",
              },
            ]}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            <Panel eyebrow="Holdings" title="Asset allocation">
              <DataState isLoading={isLoading} isError={isError} empty={!holdings.length}>
                <div className="space-y-4">
                  {holdings.map((holding) => {
                    const share =
                      portfolio?.totalUsdValue && holding.usdValue
                        ? (holding.usdValue / portfolio.totalUsdValue) * 100
                        : 0;

                    return (
                      <div key={holding.address}>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate text-foreground">{holding.symbol}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {holding.name}
                            </p>
                          </div>
                          <span className="tabular-nums text-muted-foreground">
                            {formatAmount(holding.amountUi)}
                          </span>
                          <span className="tabular-nums text-foreground">
                            {formatUsd(holding.usdValue)}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
                          <div
                            className="h-full rounded-full bg-primary/80"
                            style={{ width: `${Math.max(share, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DataState>
            </Panel>

            <Panel eyebrow="Momentum" title="Top movers">
              <DataState
                isLoading={isLoading}
                isError={isError}
                empty={!portfolio?.topMovers.length}
              >
                <ul className="space-y-3 text-sm">
                  {(portfolio?.topMovers ?? []).map((mover) => (
                    <li
                      key={mover.address}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                    >
                      <span className="rounded-full border border-border/60 bg-background/50 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {mover.symbol}
                      </span>
                      <span className="truncate text-muted-foreground">
                        Exposure {formatUsd(mover.usdValue)}
                      </span>
                      <span
                        className={cn(
                          "tabular-nums",
                          (mover.change24hPct ?? 0) >= 0 ? "text-primary" : "text-destructive",
                        )}
                      >
                        {formatPercent(mover.change24hPct)}
                      </span>
                    </li>
                  ))}
                </ul>
              </DataState>
            </Panel>
          </div>
        </>
      )}
    </AppShell>
  );
}

export function MarketsRoutePage() {
  const { data, isLoading, isError } = useMarkets();
  const stockAddressSet = useMemo(
    () => new Set(STOCK_TOKEN_ADDRESSES.map((address) => address.toLowerCase())),
    [],
  );
  const markets = useMemo(
    () =>
      (data?.markets ?? []).filter((market) => !stockAddressSet.has(market.address.toLowerCase())),
    [data?.markets, stockAddressSet],
  );
  const gainers = useMemo(
    () => [...markets].sort((a, b) => (b.change24hPct ?? -999) - (a.change24hPct ?? -999)),
    [markets],
  );
  const losers = useMemo(
    () => [...markets].sort((a, b) => (a.change24hPct ?? 999) - (b.change24hPct ?? 999)),
    [markets],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ecosystem"
        title="Crypto Market"
        subtitle="Featured Robinhood Chain crypto tokens with live prices, liquidity, and volume snapshots curated inside Vozdex AI."
      />

      <StatGrid
        items={[
          {
            k: "Tracked assets",
            v: String(markets.length || FEATURED_TOKENS.length - STOCK_TOKEN_ADDRESSES.length),
            d: "Crypto tokens",
          },
          {
            k: "Top gainer",
            v: gainers[0]?.symbol ?? "N/A",
            d: formatPercent(gainers[0]?.change24hPct),
          },
          {
            k: "Top loser",
            v: losers[0]?.symbol ?? "N/A",
            d: formatPercent(losers[0]?.change24hPct),
          },
        ]}
      />

      <div className="mt-6">
        <Panel eyebrow="Price board" title="Crypto tokens">
          <DataState isLoading={isLoading} isError={isError} empty={!markets.length}>
            <ul className="divide-y divide-border/60">
              {markets.map((row) => (
                <li
                  key={row.address}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{row.symbol}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{row.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums text-foreground">{formatUsd(row.priceUsd)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Vol {formatUsd(row.volume24hUsd)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "tabular-nums",
                      (row.change24hPct ?? 0) >= 0 ? "text-primary" : "text-destructive",
                    )}
                  >
                    {formatPercent(row.change24hPct)}
                  </span>
                </li>
              ))}
            </ul>
          </DataState>
        </Panel>
      </div>
    </AppShell>
  );
}

export function StockMarketsRoutePage() {
  const { data, isLoading, isError } = useMarkets();
  const stockAddressOrder = useMemo(
    () =>
      new Map(
        STOCK_TOKEN_ADDRESSES.map((address, index) => [address.toLowerCase(), index] as const),
      ),
    [],
  );
  const markets = useMemo(
    () =>
      (data?.markets ?? [])
        .filter((market) => stockAddressOrder.has(market.address.toLowerCase()))
        .sort(
          (left, right) =>
            (stockAddressOrder.get(left.address.toLowerCase()) ?? Number.MAX_SAFE_INTEGER) -
            (stockAddressOrder.get(right.address.toLowerCase()) ?? Number.MAX_SAFE_INTEGER),
        ),
    [data?.markets, stockAddressOrder],
  );
  const gainers = useMemo(
    () => [...markets].sort((a, b) => (b.change24hPct ?? -999) - (a.change24hPct ?? -999)),
    [markets],
  );
  const losers = useMemo(
    () => [...markets].sort((a, b) => (a.change24hPct ?? 999) - (b.change24hPct ?? 999)),
    [markets],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ecosystem"
        title="Stock Market"
        subtitle="Featured Robinhood Chain stock tokens for AAPL, AMD, AMZN, COIN, CRWV, GOOGL, INTC, META, MSFT, MU, NVDA, ORCL, PLTR, SNDK, TSLA, and USAR."
      />

      <StatGrid
        items={[
          {
            k: "Tracked assets",
            v: String(markets.length || STOCK_TOKEN_ADDRESSES.length),
            d: "Stock tokens",
          },
          {
            k: "Top gainer",
            v: gainers[0]?.symbol ?? "N/A",
            d: formatPercent(gainers[0]?.change24hPct),
          },
          {
            k: "Top loser",
            v: losers[0]?.symbol ?? "N/A",
            d: formatPercent(losers[0]?.change24hPct),
          },
        ]}
      />

      <div className="mt-6">
        <Panel eyebrow="Price board" title="Stock tokens">
          <DataState isLoading={isLoading} isError={isError} empty={!markets.length}>
            <ul className="divide-y divide-border/60">
              {markets.map((row) => (
                <li
                  key={row.address}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{row.symbol}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{row.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums text-foreground">{formatUsd(row.priceUsd)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Vol {formatUsd(row.volume24hUsd)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "tabular-nums",
                      (row.change24hPct ?? 0) >= 0 ? "text-primary" : "text-destructive",
                    )}
                  >
                    {formatPercent(row.change24hPct)}
                  </span>
                </li>
              ))}
            </ul>
          </DataState>
        </Panel>
      </div>
    </AppShell>
  );
}

export function OrdersRoutePage() {
  const executions = useOraculumStore((state) => state.executions);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Execution"
        title="Orders"
        subtitle="Recent swap intents and transaction statuses tracked in the current session."
      />

      <Panel eyebrow="Queue" title="Execution ledger">
        {executions.length ? (
          <ul className="divide-y divide-border/60">
            {executions.map((execution) => (
              <li
                key={execution.hash}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-foreground">
                    {execution.inputSymbol ?? "Token"} to {execution.outputSymbol ?? "Token"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {execution.inAmountUi != null ? formatAmount(execution.inAmountUi) : "Pending"}{" "}
                    to{" "}
                    {execution.outAmountUi != null ? formatAmount(execution.outAmountUi) : "quote"}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.22em]",
                    execution.status === "confirmed"
                      ? "border-primary/40 text-primary"
                      : execution.status === "failed"
                        ? "border-destructive/40 text-destructive"
                        : "border-border/70 text-muted-foreground",
                  )}
                >
                  {execution.status}
                </span>
                <a
                  href={execution.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary"
                >
                  Explorer <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No swap executions yet."
            description="Build and submit a live swap from the home screen to populate this ledger."
          />
        )}
      </Panel>
    </AppShell>
  );
}

export function HistoryRoutePage() {
  const { address: walletAddress, isConnected } = useAccount();
  const { data: history, isLoading, isError } = useHistory(walletAddress);
  const executions = useOraculumStore((state) => state.executions);

  const combined = useMemo(() => {
    const chainEvents = (history ?? []).map((item) => ({
      id: item.hash,
      label: item.label,
      detail: item.hash,
      status: item.status,
      kind: item.kind,
      timestamp: item.timestamp ? item.timestamp * 1000 : 0,
      url: item.explorerUrl,
    }));

    const executionEvents = executions.map((item) => ({
      id: item.hash,
      label: `${item.inputSymbol ?? "Token"} to ${item.outputSymbol ?? "Token"}`,
      detail: item.hash,
      status: item.status,
      kind: "swap" as HistoryItem["kind"],
      timestamp: Date.parse(item.createdAt),
      url: item.explorerUrl,
    }));

    return [...executionEvents, ...chainEvents].sort(
      (left, right) => right.timestamp - left.timestamp,
    );
  }, [executions, history]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Timeline"
        title="History"
        subtitle="Wallet transaction history merged with local execution records."
      />

      {!isConnected && !executions.length ? (
        <EmptyState
          title="Connect a wallet or submit a swap to build your timeline."
          description="On-chain history comes from Robinhood Chain RPC, while Vozdex AI session activity is stored in the current browser session."
        />
      ) : (
        <Panel eyebrow="Ledger" title="Recent activity">
          <DataState
            isLoading={isConnected && isLoading}
            isError={isConnected && isError}
            empty={!combined.length}
          >
            <ul className="divide-y divide-border/60">
              {combined.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3 text-sm"
                >
                  <span className="rounded-full border border-border/60 bg-background/50 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {item.kind}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{item.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {shortAddress(item.detail)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-[11px] uppercase tracking-[0.18em]",
                        item.status === "confirmed"
                          ? "text-primary"
                          : item.status === "failed"
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    >
                      {item.status}
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      {item.timestamp ? formatTime(Math.floor(item.timestamp / 1000)) : "Pending"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </DataState>
        </Panel>
      )}
    </AppShell>
  );
}

export function VoiceRoutePage() {
  const router = useRouter();
  const speech = useSpeechRecognition();
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const setLastIntent = useOraculumStore((state) => state.setLastIntent);
  const setSwapPair = useOraculumStore((state) => state.setSwapPair);
  const setSwapAmount = useOraculumStore((state) => state.setSwapAmount);
  const setVoiceReviewRequired = useOraculumStore((state) => state.setVoiceReviewRequired);
  const queueVoiceCommand = useOraculumStore((state) => state.queueVoiceCommand);

  const parseTranscript = async (rawTranscript?: string) => {
    const transcript = rawTranscript ?? speech.transcript;
    if (!transcript.trim()) {
      return;
    }

    setIsParsing(true);
    try {
      const response = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const payload = (await response.json()) as VoiceIntent & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to parse transcript.");
      }

      setIntent(payload);
      setLastIntent(payload);
      if (payload.action === "confirm" || payload.action === "cancel") {
        queueVoiceCommand(payload.action);
        return;
      }

      const inputAddress = payload.inputSymbol ? SYMBOL_TO_ADDRESS[payload.inputSymbol] : undefined;
      const outputAddress = payload.outputSymbol
        ? SYMBOL_TO_ADDRESS[payload.outputSymbol]
        : undefined;

      if (inputAddress && outputAddress) {
        setSwapPair(inputAddress, outputAddress);
      }
      if (payload.amount) {
        setSwapAmount(payload.amount);
      }
      if (
        (payload.action === "swap" || payload.action === "buy" || payload.action === "sell") &&
        payload.amount &&
        inputAddress &&
        outputAddress
      ) {
        setVoiceReviewRequired(true);
      }
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <AppShell rightRail={false}>
      <PageHeader
        eyebrow="Interface"
        title="Voice AI"
        subtitle="Capture a transcript, let Vozdex AI parse the intent, then hand the trade off to the swap terminal."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_360px]">
        <LuxCard className="p-6 sm:p-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <button
              type="button"
              onClick={() => (speech.listening ? speech.stop() : speech.start())}
              disabled={!speech.supported}
              className={cn(
                "grid h-36 w-36 place-items-center rounded-full transition-transform",
                "bg-[radial-gradient(circle_at_30%_25%,#f1ff9c_0%,var(--primary)_45%,#6f9900_100%)]",
                "shadow-[0_20px_60px_-10px_rgba(200,255,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-6px_16px_rgba(0,0,0,0.3)]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                speech.listening && "ring-4 ring-primary/30",
              )}
            >
              <Mic className="h-10 w-10 text-white" />
            </button>

            <p className="mt-5 font-sans text-3xl text-foreground">
              {speech.listening ? "Listening..." : "Voice command ready"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {speech.supported
                ? "Use your microphone or type a transcript manually."
                : "Speech recognition is not available in this browser, but typed commands still work."}
            </p>
            {speech.error ? <p className="mt-2 text-sm text-destructive">{speech.error}</p> : null}
          </div>

          <div className="mt-8 space-y-3">
            <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Transcript
            </label>
            <textarea
              value={speech.transcript}
              onChange={(event) => speech.setTranscript(event.target.value)}
              placeholder="Swap 2 ETH to USDC"
              className="min-h-36 w-full rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary/40"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => parseTranscript()}
                disabled={!speech.transcript.trim() || isParsing}
                className="rounded-xl bg-primary px-4 py-2 text-sm text-black disabled:opacity-50"
              >
                {isParsing ? "Parsing..." : "Parse intent"}
              </button>
              <button
                type="button"
                onClick={speech.reset}
                className="rounded-xl border border-border/70 px-4 py-2 text-sm text-foreground"
              >
                Reset
              </button>
              {intent && intent.action !== "unknown" ? (
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-xl border border-primary/40 px-4 py-2 text-sm text-primary"
                >
                  Send to swap
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <IntentField k="Action" v={intent?.action ?? "Waiting"} accent />
            <IntentField k="Input" v={intent?.inputSymbol ?? "Unknown"} />
            <IntentField k="Output" v={intent?.outputSymbol ?? "Unknown"} />
            <IntentField
              k="Confidence"
              v={intent ? `${Math.round(intent.confidence * 100)}%` : "N/A"}
            />
          </div>
        </LuxCard>

        <div className="space-y-6">
          <Panel eyebrow="Try saying" title="Suggestions">
            <ul className="space-y-2 text-sm">
              {[
                "Swap 2 ETH to USDC",
                "Swap 100 USDC to ETH",
                "Buy 0.1 ETH",
                "Sell 1 ETH for USDC",
              ].map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => speech.setTranscript(suggestion)}
                    className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Handoff" title="What happens next">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <AudioLines className="mt-0.5 h-4 w-4 text-primary" />
                Transcript is parsed into a structured trading intent.
              </li>
              <li className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 h-4 w-4 text-primary" />
                Vozdex AI pre-fills the swap pair and amount on the home screen.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                You still review the live quote and confirm in your wallet.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

export function SettingsRoutePage() {
  const { address } = useAccount();
  const swapInputAddress = useOraculumStore((state) => state.swapInputAddress);
  const swapOutputAddress = useOraculumStore((state) => state.swapOutputAddress);
  const slippageBps = useOraculumStore((state) => state.slippageBps);
  const priorityFee = useOraculumStore((state) => state.priorityFee);
  const setSwapPair = useOraculumStore((state) => state.setSwapPair);
  const setSlippage = useOraculumStore((state) => state.setSlippage);
  const setPriorityFee = useOraculumStore((state) => state.setPriorityFee);

  const copyRpc = async () => {
    await navigator.clipboard.writeText(
      process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com",
    );
  };

  return (
    <AppShell rightRail={false}>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        subtitle="Tune swap defaults, transaction safety, and the current Vozdex AI terminal configuration."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Trading" title="Default pair">
          <div className="grid gap-4">
            <TokenSelect
              label="Input token"
              value={swapInputAddress}
              onChange={(address) => setSwapPair(address, swapOutputAddress)}
            />
            <TokenSelect
              label="Output token"
              value={swapOutputAddress}
              onChange={(address) => setSwapPair(swapInputAddress, address)}
            />
          </div>
        </Panel>

        <Panel eyebrow="Execution" title="Safety controls">
          <div className="space-y-4">
            <label className="block text-sm text-muted-foreground">
              Slippage: <span className="text-foreground">{(slippageBps / 100).toFixed(2)}%</span>
            </label>
            <div className="flex gap-2 mb-2">
              {[0.5, 1, 2.5, 5].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setSlippage(pct * 100)}
                  className="rounded-lg border border-border/70 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50"
                >
                  {pct}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min={10}
              max={5000}
              step={10}
              value={slippageBps}
              onChange={(event) => setSlippage(Number(event.target.value))}
              className="w-full"
            />
            <label className="block text-sm text-muted-foreground">
              Priority fee
              <select
                value={priorityFee}
                onChange={(event) =>
                  setPriorityFee(event.target.value as "auto" | "low" | "medium" | "high")
                }
                className="mt-2 w-full rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-foreground outline-none"
              >
                <option value="auto">Auto</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </Panel>

        <Panel eyebrow="Wallet" title="Connection">
          <div className="space-y-3 text-sm">
            <Row k="Address" v={shortAddress(address)} />
            <Row k="Network" v="Robinhood Chain mainnet" />
            <Row k="Connectors" v="MetaMask, WalletConnect, RainbowKit" />
          </div>
        </Panel>

        <Panel eyebrow="RPC" title="Endpoint">
          <div className="space-y-4 text-sm">
            <p className="rounded-xl border border-border/70 bg-background/50 px-3 py-3 font-mono text-xs text-muted-foreground">
              {process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
                "https://rpc.mainnet.chain.robinhood.com"}
            </p>
            <button
              type="button"
              onClick={copyRpc}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-foreground"
            >
              <Copy className="h-4 w-4" />
              Copy endpoint
            </button>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function QuickGuide() {
  return (
    <Panel eyebrow="Flow" title="Execution path">
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-3">
          <Wallet className="mt-0.5 h-4 w-4 text-primary" />
          Connect a wallet to unlock balances, portfolio, and history.
        </li>
        <li className="flex items-start gap-3">
          <AudioLines className="mt-0.5 h-4 w-4 text-primary" />
          Use voice or manual token selection to define the trade.
        </li>
        <li className="flex items-start gap-3">
          <RefreshCw className="mt-0.5 h-4 w-4 text-primary" />
          Fetch a live quote, inspect price impact.
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
          Sign in your wallet and monitor confirmation in Orders and History.
        </li>
      </ul>
    </Panel>
  );
}

function TokenSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const tokens = useTokenOptions();

  return <TokenSelectField label={label} value={value} onChange={onChange} tokens={tokens} />;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <LuxCard className="p-6">
      <p className="font-sans text-2xl text-foreground">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm text-foreground"
      >
        Return to swap
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </LuxCard>
  );
}

function DataState({
  isLoading,
  isError,
  empty,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading live data...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load data right now.</p>;
  }

  if (empty) {
    return <p className="text-sm text-muted-foreground">No records available yet.</p>;
  }

  return <>{children}</>;
}

function IntentField({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{k}</p>
      <p className={cn("mt-0.5 tabular-nums text-foreground", accent && "text-primary")}>{v}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate text-right text-foreground">{v}</span>
    </div>
  );
}

export function PrivateX402PaymentsRoutePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Private payments"
        title="Private x402 Payments"
        subtitle="Private x402 payment flows handled through a voice agent are on the Vozdex AI roadmap."
      />

      <div className="mt-6">
        <LuxCard className="flex flex-col items-center justify-center p-12 text-center">
          <div className="relative mb-6 grid h-24 w-24 place-items-center rounded-full border border-border/70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background shadow-[0_0_60px_-15px_rgba(200,255,0,0.3)]">
            <AudioLines className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-sans text-3xl font-medium tracking-tight text-foreground drop-shadow-sm">
            Coming Soon
          </h2>
          <p className="mt-4 max-w-[28rem] text-sm text-muted-foreground">
            We are designing <strong>private x402 payments</strong> so a voice agent can guide,
            verify, and complete secure payment actions without exposing sensitive flow details.
          </p>
        </LuxCard>
      </div>
    </AppShell>
  );
}

export function KeyRecoveryRoutePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Recovery flow"
        title="Voice-Based Key Recovery"
        subtitle="Key recovery with voice verification and trusted contacts is planned as a safer alternative to a 12-word phrase."
      />

      <div className="mt-6">
        <LuxCard className="flex flex-col items-center justify-center p-12 text-center">
          <div className="relative mb-6 grid h-24 w-24 place-items-center rounded-full border border-border/70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background shadow-[0_0_60px_-15px_rgba(200,255,0,0.3)]">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-sans text-3xl font-medium tracking-tight text-foreground drop-shadow-sm">
            Coming Soon
          </h2>
          <p className="mt-4 max-w-[28rem] text-sm text-muted-foreground">
            We are building <strong>voice-based key recovery</strong> using a voice challenge as one
            recovery factor, combined with trusted contacts, so users can verify it is really them
            without depending only on a seed phrase.
          </p>
        </LuxCard>
      </div>
    </AppShell>
  );
}
