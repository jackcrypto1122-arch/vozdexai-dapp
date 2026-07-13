"use client";

import { useMemo } from "react";
import { ETH_ADDRESS, FEATURED_TOKENS, USDC_ADDRESS } from "@/lib/constants";
import { useMarkets } from "@/hooks/use-oraculum-data";
import { useOraculumStore } from "@/store/oraculum-store";
import type { TokenInfo } from "@/types/dapp";

function dedupeTokens(tokens: TokenInfo[]) {
  const byAddress = new Map<string, TokenInfo>();
  for (const token of tokens) {
    byAddress.set(token.address.toLowerCase(), token);
  }
  return Array.from(byAddress.values());
}

export function useTokenOptions() {
  const customTokens = useOraculumStore((state) => state.customTokens);
  const { data: marketPayload } = useMarkets();

  return useMemo(() => {
    const marketTokens: TokenInfo[] = (marketPayload?.markets ?? [])
      .filter((token) => token.decimals != null)
      .map((token) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals ?? 18,
        logoUri: token.logoUri,
      }));

    const liveAddresses = new Set(marketTokens.map((token) => token.address.toLowerCase()));
    const baselineTokens = marketTokens.length
      ? FEATURED_TOKENS.filter(
          (token) =>
            token.address.toLowerCase() === ETH_ADDRESS.toLowerCase() ||
            liveAddresses.has(token.address.toLowerCase()),
        )
      : FEATURED_TOKENS.filter(
          (token) => token.address.toLowerCase() !== USDC_ADDRESS.toLowerCase(),
        );

    return dedupeTokens([...baselineTokens, ...marketTokens, ...customTokens]);
  }, [customTokens, marketPayload?.markets]);
}
