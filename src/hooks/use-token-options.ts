"use client";

import { useMemo } from "react";
import { FEATURED_TOKENS } from "@/lib/constants";
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

  return useMemo(() => dedupeTokens([...FEATURED_TOKENS, ...customTokens]), [customTokens]);
}
