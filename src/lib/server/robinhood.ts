import {
  createPublicClient,
  http,
  createWalletClient,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  getContract,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  DEFAULT_RPC_URL,
  ETH_ADDRESS,
  USDC_ADDRESS,
  FEATURED_TOKENS,
  UNISWAP_V3_QUOTER_ADDRESS,
  UNISWAP_V3_ROUTER_ADDRESS,
  UNISWAP_V3_FEE_TIER,
  ROBINHOOD_CHAIN_ID,
} from "@/lib/constants";
import { resolveTokenMetadata } from "@/lib/server/token-metadata";
import type {
  QuoteRequest,
  QuoteResponse,
  SwapBuildResponse,
  WalletBalance,
  PortfolioSummary,
  HistoryItem,
  MarketRow,
} from "@/types/dapp";

function shortAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function getExplorerUrl(hash: string) {
  return `https://explorer.chain.robinhood.com/tx/${hash}`;
}

function getPublicClient() {
  return createPublicClient({
    chain: { id: ROBINHOOD_CHAIN_ID, name: "Robinhood Chain" } as unknown as Chain,
    transport: http(DEFAULT_RPC_URL),
  });
}

// Uniswap V3 Quoter ABI (minimal)
const QUOTER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
    ],
    name: "quoteExactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Uniswap V3 Router ABI (minimal)
const ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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

export async function getQuote(request: QuoteRequest): Promise<QuoteResponse> {
  const inputMetadata = await resolveTokenMetadata(request.inputAddress);
  const outputMetadata = await resolveTokenMetadata(request.outputAddress);
  const tokenIn = inputMetadata.token.address as `0x${string}`;
  const tokenOut = outputMetadata.token.address as `0x${string}`;
  const amountIn = BigInt(request.amountRaw);

  // Get token info
  const tokenInInfo =
    FEATURED_TOKENS.find((t) => t.address.toLowerCase() === tokenIn.toLowerCase()) ??
    inputMetadata.token;
  const tokenOutInfo =
    FEATURED_TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase()) ??
    outputMetadata.token;
  const decimalsIn = tokenInInfo?.decimals ?? 18;
  const decimalsOut = tokenOutInfo?.decimals ?? 18;

  let amountOut: bigint;
  try {
    // Try to get real quote if possible
    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
      amountOut = amountIn;
    } else {
      const publicClient = getPublicClient();
      const livePrices = await getDexScreenerPrices([
        { address: tokenIn, symbol: tokenInInfo?.symbol ?? "IN" },
        { address: tokenOut, symbol: tokenOutInfo?.symbol ?? "OUT" },
      ]);

      const amountInUi = Number(formatUnits(amountIn, decimalsIn));
      const inPriceUsd = livePrices[tokenInInfo?.symbol ?? "IN"]?.usd || 1;
      const outPriceUsd = livePrices[tokenOutInfo?.symbol ?? "OUT"]?.usd || 1;
      const amountOutUi = (amountInUi * inPriceUsd) / outPriceUsd;
      amountOut = parseUnits(amountOutUi.toFixed(decimalsOut), decimalsOut);
    }
  } catch {
    // Fallback mock if anything fails
    const MOCK_PRICES: Record<string, number> = {
      ETH: 3500,
      USDC: 1,
      ARROW: 1.62,
      CASHCAT: 0.142,
    };

    const amountInUi = Number(formatUnits(amountIn, decimalsIn));
    const inPriceUsd = tokenInInfo?.symbol ? (MOCK_PRICES[tokenInInfo.symbol] ?? 1) : 1;
    const outPriceUsd = tokenOutInfo?.symbol ? (MOCK_PRICES[tokenOutInfo.symbol] ?? 1) : 1;
    const amountOutUi = (amountInUi * inPriceUsd) / outPriceUsd;
    amountOut = parseUnits(amountOutUi.toFixed(decimalsOut), decimalsOut);
  }

  return {
    inputAddress: tokenIn,
    outputAddress: tokenOut,
    inAmountRaw: request.amountRaw,
    outAmountRaw: amountOut.toString(),
    outAmountUi: Number(formatUnits(amountOut, decimalsOut)),
    priceImpactPct: 0.1, // Placeholder
    estimatedGas: "21000", // Placeholder
  };
}

export async function buildSwap(request: QuoteRequest): Promise<SwapBuildResponse> {
  const quote = await getQuote(request);
  const inputMetadata = await resolveTokenMetadata(request.inputAddress);
  const outputMetadata = await resolveTokenMetadata(request.outputAddress);
  const tokenIn = inputMetadata.token.address as `0x${string}`;
  const tokenOut = outputMetadata.token.address as `0x${string}`;
  const amountIn = BigInt(request.amountRaw);
  const slippageMultiplier = BigInt(10000 - request.slippageBps);
  const amountOutMinimum = (BigInt(quote.outAmountRaw) * slippageMultiplier) / 10000n;

  const data = encodeFunctionData({
    abi: ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        fee: UNISWAP_V3_FEE_TIER,
        recipient: request.walletAddress as `0x${string}`,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  const value = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase() ? amountIn.toString() : "0";

  return {
    to: UNISWAP_V3_ROUTER_ADDRESS,
    data,
    value,
    gas: "200000",
    quote,
  };
}

export async function getWalletBalances(walletAddress: string): Promise<WalletBalance[]> {
  const publicClient = getPublicClient();
  const balances: WalletBalance[] = [];

  // Get prices from DexScreener first
  const prices = await getDexScreenerPrices([...FEATURED_TOKENS]);

  // Native ETH
  const ethBalance = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
  const ethToken = FEATURED_TOKENS.find((t) => t.address === ETH_ADDRESS)!;
  const ethPriceData = prices["ETH"];
  const ethUsdPrice = ethPriceData?.usd ?? 3500;
  const ethAmountUi = Number(formatUnits(ethBalance, ethToken.decimals));

  balances.push({
    address: ETH_ADDRESS,
    symbol: ethToken.symbol,
    name: ethToken.name,
    decimals: ethToken.decimals,
    amountRaw: ethBalance.toString(),
    amountUi: ethAmountUi,
    usdPrice: ethUsdPrice,
    usdValue: ethAmountUi * ethUsdPrice,
    priceChange24hPct: ethPriceData?.usd_24h_change ?? 2.5,
    isNativeEth: true,
  });

  // ERC20 tokens
  for (const token of FEATURED_TOKENS.filter((t) => t.address !== ETH_ADDRESS)) {
    try {
      const balance = await publicClient.readContract({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      });

      if (balance > 0n) {
        const priceData = prices[token.symbol];
        const usdPrice = priceData?.usd ?? (token.symbol === "USDC" ? 1 : 0);
        const amountUi = Number(formatUnits(balance, token.decimals));

        balances.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          amountRaw: balance.toString(),
          amountUi,
          usdPrice,
          usdValue: amountUi * usdPrice,
          priceChange24hPct: priceData?.usd_24h_change ?? 0,
          isNativeEth: false,
        });
      }
    } catch {
      // Ignore
    }
  }

  return balances.sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));
}

export async function getPortfolioSummary(walletAddress: string): Promise<PortfolioSummary> {
  const holdings = await getWalletBalances(walletAddress);
  const totalUsdValue = holdings.reduce((sum, h) => sum + (h.usdValue ?? 0), 0);

  const topMovers = [...holdings]
    .filter((h) => h.priceChange24hPct != null)
    .sort((a, b) => Math.abs(b.priceChange24hPct!) - Math.abs(a.priceChange24hPct!))
    .slice(0, 3)
    .map((h) => ({
      address: h.address,
      symbol: h.symbol,
      change24hPct: h.priceChange24hPct,
      usdValue: h.usdValue,
    }));

  return { walletAddress, totalUsdValue, holdings, topMovers };
}

export async function getWalletHistory(walletAddress: string, limit = 12): Promise<HistoryItem[]> {
  try {
    const response = await fetch(
      `https://robinhoodchain.blockscout.com/api/v2/addresses/${walletAddress}/transactions`,
    );
    if (!response.ok) return [];

    const data = await response.json();
    if (!data || !data.items || !Array.isArray(data.items)) return [];

    const history: HistoryItem[] = data.items.slice(0, limit).map((rawTx: unknown) => {
      const tx = rawTx as {
        hash: string;
        result?: string;
        status?: string;
        block?: number;
        timestamp?: string;
        method?: string;
        from?: { hash: string };
        to?: { hash: string };
      };
      let kind: HistoryItem["kind"] = "unknown";
      let label = "Contract Execution";

      // Basic heuristic for tx kind
      if (tx.method === "swap" || tx.method?.includes("swap")) {
        kind = "swap";
        label = "Swap Token";
      } else if (tx.from?.hash?.toLowerCase() === walletAddress.toLowerCase()) {
        kind = "send";
        label = "Send Transaction";
      } else if (tx.to?.hash?.toLowerCase() === walletAddress.toLowerCase()) {
        kind = "receive";
        label = "Receive Transaction";
      }

      const timestamp = tx.timestamp ? new Date(tx.timestamp).getTime() : null;

      return {
        hash: tx.hash,
        status:
          tx.result === "success" || tx.status === "ok"
            ? "confirmed"
            : tx.result === "error"
              ? "failed"
              : "pending",
        blockNumber: tx.block || 0,
        timestamp,
        explorerUrl: `https://robinhoodchain.blockscout.com/tx/${tx.hash}`,
        label,
        kind,
      };
    });

    return history;
  } catch {
    return [];
  }
}

interface DexPrice {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
  market_cap: number;
}

// DexScreener API helper for live token data
async function getDexScreenerPrices(
  tokens: { address: string; symbol: string }[],
): Promise<Record<string, DexPrice>> {
  const result: Record<string, DexPrice> = {};

  await Promise.all(
    tokens.map(async (t) => {
      try {
        let priceData: DexPrice | null = null;
        let res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${t.address}`, {
          next: { revalidate: 30 },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            priceData = {
              usd: Number(pair.priceUsd || 0),
              usd_24h_change: Number(pair.priceChange?.h24 || 0),
              usd_24h_vol: Number(pair.volume?.h24 || 0),
              market_cap: Number(pair.marketCap || pair.fdv || 0),
            };
          }
        }

        if (!priceData) {
          res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/robinhood/${t.address}`, {
            next: { revalidate: 30 },
          });
          if (res.ok) {
            const data = await res.json();
            const pair = data.pairs?.[0] || data.pair;
            if (pair) {
              priceData = {
                usd: Number(pair.priceUsd || 0),
                usd_24h_change: Number(pair.priceChange?.h24 || 0),
                usd_24h_vol: Number(pair.volume?.h24 || 0),
                market_cap: Number(pair.marketCap || pair.fdv || 0),
              };
            }
          }
        }

        result[t.symbol] = priceData || {
          usd: t.symbol === "ETH" ? 3500 : t.symbol === "USDC" ? 1 : 0,
          usd_24h_change: 0,
          usd_24h_vol: 0,
          market_cap: 0,
        };
      } catch {
        result[t.symbol] = {
          usd: t.symbol === "ETH" ? 3500 : t.symbol === "USDC" ? 1 : 0,
          usd_24h_change: 0,
          usd_24h_vol: 0,
          market_cap: 0,
        };
      }
    }),
  );

  return result;
}

export async function getMarketRows(addresses: string[]): Promise<MarketRow[]> {
  const prices = await getDexScreenerPrices([...FEATURED_TOKENS]);

  const rows: MarketRow[] = [];

  for (const token of FEATURED_TOKENS) {
    const priceData = prices[token.symbol];

    rows.push({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      priceUsd: priceData?.usd ?? (token.symbol === "USDC" ? 1 : null),
      change24hPct: priceData?.usd_24h_change ?? null,
      volume24hUsd: priceData?.usd_24h_vol ?? null,
      liquidityUsd: null, // Can be added later with DEX API
      marketCap: priceData?.market_cap ?? null,
    });
  }

  return rows;
}

export async function getNetworkSnapshot() {
  const publicClient = getPublicClient();
  const blockNumber = await publicClient.getBlockNumber();

  return {
    rpcUrl: DEFAULT_RPC_URL,
    network: "robinhood",
    blockNumber: Number(blockNumber),
  };
}

export function walletDisplay(address?: string | null) {
  return address ? shortAddress(address) : "not connected";
}
