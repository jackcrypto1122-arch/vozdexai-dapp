"use client";

import { useMemo } from "react";
import { FEATURED_TOKENS } from "@/lib/constants";
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

    return dedupeTokens([...FEATURED_TOKENS, ...marketTokens, ...customTokens]);
  }, [customTokens, marketPayload?.markets]);
}
