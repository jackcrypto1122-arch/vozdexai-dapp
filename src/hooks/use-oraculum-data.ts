"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  HistoryItem,
  MarketRow,
  PortfolioSummary,
  QuoteResponse,
  TokenMetadataResponse,
  WalletBalance,
} from "@/types/dapp";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () =>
      fetchJson<{ markets: MarketRow[]; network: Record<string, unknown> }>("/api/markets/list"),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useWalletBalances(walletAddress?: string | null) {
  return useQuery({
    queryKey: ["balances", walletAddress],
    queryFn: async () => {
      const payload = await fetchJson<{ balances: WalletBalance[] }>(
        `/api/wallet/balances?wallet=${walletAddress}`,
      );
      return payload.balances;
    },
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
    refetchInterval: 20_000,
  });
}

export function usePortfolio(walletAddress?: string | null) {
  return useQuery({
    queryKey: ["portfolio", walletAddress],
    queryFn: () => fetchJson<PortfolioSummary>(`/api/wallet/portfolio?wallet=${walletAddress}`),
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
    refetchInterval: 20_000,
  });
}

export function useHistory(walletAddress?: string | null) {
  return useQuery({
    queryKey: ["history", walletAddress],
    queryFn: async () => {
      const payload = await fetchJson<{ history: HistoryItem[] }>(
        `/api/wallet/history?wallet=${walletAddress}`,
      );
      return payload.history;
    },
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useQuote(
  request: {
    inputAddress: string;
    outputAddress: string;
    amountRaw: string;
    slippageBps: number;
    walletAddress: string;
  } | null,
) {
  return useQuery({
    queryKey: ["quote", request],
    queryFn: () =>
      fetchJson<QuoteResponse>("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
    enabled: Boolean(request),
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

export function useTokenMetadata(address?: string | null, enabled = true) {
  return useQuery({
    queryKey: ["token-metadata", address?.toLowerCase()],
    queryFn: () =>
      fetchJson<TokenMetadataResponse>(
        `/api/tokens/metadata?address=${encodeURIComponent(address ?? "")}`,
      ),
    enabled: Boolean(address) && enabled,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
}
