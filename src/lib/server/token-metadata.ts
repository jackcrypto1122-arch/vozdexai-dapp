"use server";

import { createPublicClient, hexToString, http, isAddress, type Chain, type Hex } from "viem";
import {
  DEFAULT_EXPLORER,
  DEFAULT_RPC_URL,
  FEATURED_TOKENS,
  ROBINHOOD_CHAIN_ID,
  WETH_ADDRESS,
  normalizeTokenAddress,
} from "@/lib/constants";
import type { TokenInfo, TokenMetadataResponse } from "@/types/dapp";

const CACHE_TTL_MS = 15 * 60 * 1000;

type CachedTokenMetadata = {
  value: TokenMetadataResponse;
  expiresAt: number;
};

const metadataCache = new Map<string, CachedTokenMetadata>();

const ERC20_STRING_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ERC20_BYTES32_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const POOL_ABI = [
  {
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

function getPublicClient() {
  return createPublicClient({
    chain: { id: ROBINHOOD_CHAIN_ID, name: "Robinhood Chain" } as unknown as Chain,
    transport: http(DEFAULT_RPC_URL),
  });
}

function decodeBytes32(value: Hex) {
  return hexToString(value, { size: 32 }).replace(/\0/g, "").trim();
}

function getCachedMetadata(address: string) {
  const cached = metadataCache.get(address.toLowerCase());
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    metadataCache.delete(address.toLowerCase());
    return null;
  }

  return {
    ...cached.value,
    cacheHit: true,
  };
}

function cacheMetadata(addresses: string[], value: TokenMetadataResponse) {
  const expiresAt = Date.now() + CACHE_TTL_MS;
  const uniqueAddresses = new Set(addresses.map((address) => address.toLowerCase()));
  for (const address of uniqueAddresses) {
    metadataCache.set(address, { value, expiresAt });
  }
}

async function tryReadErc20Metadata(address: string): Promise<TokenInfo | null> {
  const client = getPublicClient();

  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_STRING_ABI,
        functionName: "name",
      }),
      client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_STRING_ABI,
        functionName: "symbol",
      }),
      client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_STRING_ABI,
        functionName: "decimals",
      }),
    ]);

    return {
      address,
      name,
      symbol,
      decimals,
    };
  } catch {
    try {
      const [name, symbol, decimals] = await Promise.all([
        client.readContract({
          address: address as `0x${string}`,
          abi: ERC20_BYTES32_ABI,
          functionName: "name",
        }),
        client.readContract({
          address: address as `0x${string}`,
          abi: ERC20_BYTES32_ABI,
          functionName: "symbol",
        }),
        client.readContract({
          address: address as `0x${string}`,
          abi: ERC20_STRING_ABI,
          functionName: "decimals",
        }),
      ]);

      return {
        address,
        name: decodeBytes32(name),
        symbol: decodeBytes32(symbol),
        decimals,
      };
    } catch {
      return null;
    }
  }
}

async function tryReadPoolTokens(address: string) {
  const client = getPublicClient();

  try {
    const [token0, token1] = await Promise.all([
      client.readContract({
        address: address as `0x${string}`,
        abi: POOL_ABI,
        functionName: "token0",
      }),
      client.readContract({
        address: address as `0x${string}`,
        abi: POOL_ABI,
        functionName: "token1",
      }),
    ]);

    return Array.from(new Set([token0, token1]));
  } catch {
    return [];
  }
}

async function tryReadExplorerMetadata(address: string): Promise<TokenInfo | null> {
  try {
    const response = await fetch(`${DEFAULT_EXPLORER}/api/v2/tokens/${address}`, {
      next: { revalidate: 900 },
    });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      name?: string;
      symbol?: string;
      decimals?: string | number;
    };

    if (!payload.name || !payload.symbol || payload.decimals == null) {
      return null;
    }

    return {
      address,
      name: payload.name,
      symbol: payload.symbol,
      decimals:
        typeof payload.decimals === "number"
          ? payload.decimals
          : Number.parseInt(payload.decimals, 10),
    };
  } catch {
    return null;
  }
}

function toMetadataResponse(
  requestedAddress: string,
  token: TokenInfo,
  resolvedFromPool: boolean,
): TokenMetadataResponse {
  return {
    token,
    requestedAddress,
    resolvedAddress: token.address,
    resolvedFromPool,
    cacheHit: false,
  };
}

export async function resolveTokenMetadata(
  requestedAddress: string,
): Promise<TokenMetadataResponse> {
  const cached = getCachedMetadata(requestedAddress);
  if (cached) {
    return cached;
  }

  const normalizedAddress = normalizeTokenAddress(requestedAddress);
  const resolvedFromPool = normalizedAddress.toLowerCase() !== requestedAddress.toLowerCase();

  if (!isAddress(requestedAddress) && !isAddress(normalizedAddress)) {
    throw new Error("Enter a valid EVM contract address.");
  }

  const featuredToken = FEATURED_TOKENS.find((token) => {
    const tokenAddress = token.address.toLowerCase();
    return (
      tokenAddress === requestedAddress.toLowerCase() ||
      tokenAddress === normalizedAddress.toLowerCase()
    );
  });
  if (featuredToken) {
    const payload = toMetadataResponse(requestedAddress, featuredToken, resolvedFromPool);
    cacheMetadata([requestedAddress, normalizedAddress, featuredToken.address], payload);
    return payload;
  }

  if (resolvedFromPool) {
    const token =
      (await tryReadErc20Metadata(normalizedAddress)) ??
      (await tryReadExplorerMetadata(normalizedAddress));

    if (!token) {
      throw new Error(
        "We found a pool address, but could not resolve its underlying token metadata.",
      );
    }

    const payload = toMetadataResponse(requestedAddress, token, true);
    cacheMetadata([requestedAddress, normalizedAddress, token.address], payload);
    return payload;
  }

  const directToken =
    (await tryReadErc20Metadata(requestedAddress)) ??
    (await tryReadExplorerMetadata(requestedAddress));
  if (directToken) {
    const payload = toMetadataResponse(requestedAddress, directToken, false);
    cacheMetadata([requestedAddress, directToken.address], payload);
    return payload;
  }

  const poolTokens = await tryReadPoolTokens(requestedAddress);
  if (poolTokens.length) {
    const prioritizedPoolTokens = [
      ...poolTokens.filter((address) => address.toLowerCase() !== WETH_ADDRESS.toLowerCase()),
      ...poolTokens.filter((address) => address.toLowerCase() === WETH_ADDRESS.toLowerCase()),
    ];

    for (const tokenAddress of prioritizedPoolTokens) {
      const poolToken =
        (await tryReadErc20Metadata(tokenAddress)) ?? (await tryReadExplorerMetadata(tokenAddress));

      if (poolToken) {
        const payload = toMetadataResponse(requestedAddress, poolToken, true);
        cacheMetadata([requestedAddress, tokenAddress, poolToken.address], payload);
        return payload;
      }
    }

    throw new Error(
      "This address looks like a liquidity pool, but its token metadata could not be resolved.",
    );
  }

  throw new Error("Token metadata was not found for this contract address.");
}
