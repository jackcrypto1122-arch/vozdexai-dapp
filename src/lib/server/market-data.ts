import { FEATURED_TOKENS, ETH_ADDRESS, USDC_ADDRESS, normalizeTokenAddress } from "@/lib/constants";
import type { MarketRow } from "@/types/dapp";

type DexPair = {
  chainId: string;
  pairAddress: string;
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number;
  fdv?: number;
  baseToken: { address: string; symbol: string; name: string };
  quoteToken: { address: string; symbol: string; name: string };
};

const FEATURED_MAP = new Map<string, (typeof FEATURED_TOKENS)[number]>(
  FEATURED_TOKENS.map((token) => [token.address, token]),
);

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function selectBestPair(mint: string, pairs: DexPair[]) {
  return pairs

    .sort((left, right) => {
      const leftScore = (left.liquidity?.usd ?? 0) + (left.volume?.h24 ?? 0);
      const rightScore = (right.liquidity?.usd ?? 0) + (right.volume?.h24 ?? 0);
      return rightScore - leftScore;
    })
    .find((pair) => pair.baseToken.address === mint || pair.quoteToken.address === mint);
}

function toMarketRow(mint: string, pair?: DexPair): MarketRow {
  const featured = FEATURED_MAP.get(mint);
  const isBase = pair?.baseToken.address === mint;
  const token = pair
    ? isBase
      ? pair.baseToken
      : pair.quoteToken
    : {
        address: mint,
        symbol: featured?.symbol ?? `${mint.slice(0, 4)}…${mint.slice(-4)}`,
        name: featured?.name ?? mint,
      };

  return {
    address: mint,
    symbol: token.symbol,
    name: token.name,
    priceUsd: pair?.priceUsd ? Number(pair.priceUsd) : mint === USDC_ADDRESS ? 1 : null,
    change24hPct: pair?.priceChange?.h24 ?? null,
    volume24hUsd: pair?.volume?.h24 ?? null,
    liquidityUsd: pair?.liquidity?.usd ?? null,
    marketCap: pair?.marketCap ?? pair?.fdv ?? null,
    pairAddress: pair?.pairAddress,
  };
}

export async function getMarketRows(
  mints: string[] = FEATURED_TOKENS.map((token) => token.address),
) {
  const uniqueMints = Array.from(new Set(mints.map((mint) => normalizeTokenAddress(mint))));
  const pairsByMint = new Map<string, DexPair | undefined>();

  for (const mintChunk of chunk(
    uniqueMints.filter((mint) => mint !== ETH_ADDRESS),
    25,
  )) {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mintChunk.join(",")}`,
      {
        next: { revalidate: 30 },
      },
    );

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as { pairs?: DexPair[] };
    for (const mint of mintChunk) {
      const matchingPairs = (payload.pairs ?? []).filter(
        (pair) => pair.baseToken.address === mint || pair.quoteToken.address === mint,
      );
      pairsByMint.set(mint, selectBestPair(mint, matchingPairs));
    }
  }

  const solPair = pairsByMint.get(ETH_ADDRESS);
  if (!solPair) {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${ETH_ADDRESS},${USDC_ADDRESS}`,
        {
          next: { revalidate: 30 },
        },
      );
      if (response.ok) {
        const payload = (await response.json()) as { pairs?: DexPair[] };
        pairsByMint.set(ETH_ADDRESS, selectBestPair(ETH_ADDRESS, payload.pairs ?? []));
      }
    } catch {
      pairsByMint.set(ETH_ADDRESS, undefined);
    }
  }

  return uniqueMints.map((mint) => toMarketRow(mint, pairsByMint.get(mint)));
}

export async function getMarketMap(addresses: string[]) {
  const rows = await getMarketRows(addresses);
  return new Map(rows.map((row) => [row.address, row]));
}
