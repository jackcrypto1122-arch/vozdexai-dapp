import {
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  encodeAbiParameters,
  encodePacked,
  parseAbiParameters,
  type Chain,
  type Hex,
} from "viem";
import {
  DEFAULT_RPC_URL,
  ETH_ADDRESS,
  USDC_ADDRESS,
  FEATURED_TOKENS,
  UNIVERSAL_ROUTER_ADDRESS,
  UNISWAP_V3_FEE_TIER,
  ROBINHOOD_CHAIN_ID,
  WETH_ADDRESS,
  normalizeTokenAddress,
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

// Universal Router ABI (minimal – execute only)
const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
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
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ─── Universal Router command bytes ───
const CMD_V4_SWAP = 0x10;
const CMD_WRAP_ETH = 0x0b;
const CMD_UNWRAP_WETH = 0x0c;

// ─── V4 Actions ───
const V4_SWAP_EXACT_IN_SINGLE = "0x07";
const V4_SETTLE = "0x0b";
const V4_TAKE = "0x0e";

// ─── V4 ABIs ───
// We do not use V4_EXACT_IN_ABI because Robinhood Chain Universal Router has an older/nonstandard
// layout for Param 0 (with 4 extra hex words). We use dynamic hex string templating instead.

const V4_SETTLE_ABI = parseAbiParameters("address currency, uint256 amount, bool payerIsUser");
const V4_TAKE_ABI = parseAbiParameters("address currency, address recipient, uint256 amount");
const V4_WRAPPER_ABI = parseAbiParameters("bytes actions, bytes[] params");

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
    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
      amountOut = amountIn;
    } else {
      const livePrices = await getDexScreenerPrices([
        { address: tokenIn, symbol: tokenInInfo?.symbol ?? "IN" },
        { address: tokenOut, symbol: tokenOutInfo?.symbol ?? "OUT" },
      ]);

      const amountInUi = Number(formatUnits(amountIn, decimalsIn));
      const inPriceUsd = livePrices[tokenIn.toLowerCase()]?.usd || 0;
      const outPriceUsd = livePrices[tokenOut.toLowerCase()]?.usd || 0;

      if (!inPriceUsd || !outPriceUsd) {
        throw new Error("Live pricing is unavailable for the selected pair.");
      }

      const amountOutUi = (amountInUi * inPriceUsd) / outPriceUsd;
      amountOut = parseUnits(amountOutUi.toFixed(decimalsOut), decimalsOut);
    }
  } catch {
    // Fallback mock if anything fails
    const MOCK_PRICES: Record<string, number> = {
      WETH: 3500,
      USDC: 1,
      ARROW: 1.43,
      CASHCAT: 0.1655,
      HOODRAT: 0.01346,
      JUGGERNAUT: 0.01284,
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
  const recipient = request.walletAddress as `0x${string}`;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

  const isNativeIn = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase();
  const isNativeOut = tokenOut.toLowerCase() === ETH_ADDRESS.toLowerCase();

  // Resolve actual on-chain addresses (native ETH → WETH for on-chain swap)
  const actualTokenIn = isNativeIn ? (WETH_ADDRESS as `0x${string}`) : tokenIn;
  const actualTokenOut = isNativeOut ? (WETH_ADDRESS as `0x${string}`) : tokenOut;

  const tokenInInfo =
    FEATURED_TOKENS.find((t) => t.address.toLowerCase() === tokenIn.toLowerCase()) ??
    inputMetadata.token;
  const tokenOutInfo =
    FEATURED_TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase()) ??
    outputMetadata.token;

  // Find dex configuration for the non-ETH token (which dictates the pool we use)
  const nonEthTokenInfo = isNativeIn ? tokenOutInfo : tokenInInfo;
  const feeTier = (nonEthTokenInfo as any)?.feeTier || 2888;
  const feeHex = feeTier.toString(16).padStart(64, "0");

  const ROUTER_AS_RECIPIENT = "0x0000000000000000000000000000000000000002" as `0x${string}`;

  let commands: Hex;
  let inputs: Hex[];
  let value = "0";

  // We use the EXACT hex structure from the successful Robinhood Chain transaction.
  const pad32 = (hexOrNum: string | bigint | number) => {
    let raw = typeof hexOrNum === "string" ? hexOrNum.replace("0x", "") : hexOrNum.toString(16);
    return raw.padStart(64, "0");
  };

  const encodeV4Payload = (isETHtoToken: boolean) => {
    const userOrRouter = isETHtoToken ? recipient : ROUTER_AS_RECIPIENT;

    // In our successful struct for Param 0:
    const p0: Hex = `0x0000000000000000000000000000000000000000000000000000000000000020${pad32(WETH_ADDRESS)}00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001a0${pad32(amountIn)}${pad32(amountOutMinimum)}00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020${pad32(isNativeIn ? actualTokenOut : actualTokenIn)}${feeHex}0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`;

    const settleToken = isNativeIn ? WETH_ADDRESS : actualTokenIn;
    const payerIsUserHex = isNativeIn ? "00" : "01";
    const p1: Hex = `0x0000000000000000000000000000000000000000000000000000000000000020${pad32(settleToken)}0000000000000000000000000000000000000000000000000000000000000000${payerIsUserHex.padStart(64, "0")}`;

    const takeToken = isNativeIn ? actualTokenOut : WETH_ADDRESS;
    const takeRecipient = isNativeIn ? recipient : ROUTER_AS_RECIPIENT;
    const p2: Hex = `0x0000000000000000000000000000000000000000000000000000000000000020${pad32(takeToken)}${pad32(takeRecipient)}0000000000000000000000000000000000000000000000000000000000000000`;

    return encodeAbiParameters(V4_WRAPPER_ABI, [
      `0x070b0e` as Hex,
      [p0, p1, p2]
    ]);
  };

  if (isNativeIn) {
    // ETH → Token: WRAP_ETH (0x0b) + V4_SWAP (0x10)
    commands = `0x0b10` as Hex;
    value = amountIn.toString();

    // WRAP_ETH
    const wrapInput = encodeAbiParameters(parseAbiParameters("address, uint256"), [
      ROUTER_AS_RECIPIENT,
      amountIn,
    ]);

    const v4Payload = encodeV4Payload(true);

    inputs = [wrapInput, v4Payload];
  } else if (isNativeOut) {
    // Token → ETH: V4_SWAP (0x10) + UNWRAP_WETH (0x0c)
    commands = `0x100c` as Hex;

    const v4Payload = encodeV4Payload(false);

    // UNWRAP_WETH
    const unwrapInput = encodeAbiParameters(parseAbiParameters("address, uint256"), [
      recipient,
      amountOutMinimum,
    ]);

    inputs = [v4Payload, unwrapInput];
  } else {
    // Token → Token: V4_SWAP (0x10)
    commands = `0x10` as Hex;

    const v4Payload = encodeV4Payload(false);

    inputs = [v4Payload];
  }


  const data = encodeFunctionData({
    abi: UNIVERSAL_ROUTER_ABI,
    functionName: "execute",
    args: [commands, inputs, deadline],
  });

  // ── Check if ERC-20 approval to the Universal Router is needed ──
  let approvalNeeded: { token: string; spender: string } | undefined;
  if (!isNativeIn) {
    try {
      const publicClient = getPublicClient();
      const allowance = await publicClient.readContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [recipient, UNIVERSAL_ROUTER_ADDRESS as `0x${string}`],
      });
      if (allowance < amountIn) {
        approvalNeeded = { token: tokenIn, spender: UNIVERSAL_ROUTER_ADDRESS };
      }
    } catch {
      // If we can't check, assume approval is needed
      approvalNeeded = { token: tokenIn, spender: UNIVERSAL_ROUTER_ADDRESS };
    }
  }

  return {
    to: UNIVERSAL_ROUTER_ADDRESS,
    data,
    value,
    gas: "300000",
    quote,
    approvalNeeded,
  };
}

export async function getWalletBalances(walletAddress: string): Promise<WalletBalance[]> {
  const publicClient = getPublicClient();
  const balances: WalletBalance[] = [];

  const prices = await getDexScreenerPrices([...FEATURED_TOKENS]);

  // Native ETH balance
  const nativeEthToken = FEATURED_TOKENS.find((token) => token.address === ETH_ADDRESS);
  if (nativeEthToken) {
    try {
      const ethBalance = await publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });
      const ethPriceData = prices[ETH_ADDRESS.toLowerCase()];
      const ethUsdPrice = ethPriceData?.usd ?? 3500;
      const ethAmountUi = Number(formatUnits(ethBalance, nativeEthToken.decimals));

      balances.push({
        address: ETH_ADDRESS,
        symbol: nativeEthToken.symbol,
        name: nativeEthToken.name,
        decimals: nativeEthToken.decimals,
        amountRaw: ethBalance.toString(),
        amountUi: ethAmountUi,
        usdPrice: ethUsdPrice || null,
        usdValue: ethPriceData?.usd ? ethAmountUi * ethUsdPrice : null,
        priceChange24hPct: ethPriceData?.usd_24h_change ?? 0,
        isNativeEth: true,
      });
    } catch {
      // Ignore
    }
  }

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
        const priceData = prices[token.address.toLowerCase()];
        const usdPrice = priceData?.usd ?? (token.symbol === "USDC" ? 1 : 0);
        const amountUi = Number(formatUnits(balance, token.decimals));

        balances.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          amountRaw: balance.toString(),
          amountUi,
          usdPrice: usdPrice || null,
          usdValue: usdPrice ? amountUi * usdPrice : null,
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

type DexPair = {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  priceNative?: string;
  priceUsd?: string;
  txns?: {
    m5?: { buys?: number; sells?: number };
    h1?: { buys?: number; sells?: number };
    h6?: { buys?: number; sells?: number };
    h24?: { buys?: number; sells?: number };
  };
  volume?: { h24?: number; h6?: number; h1?: number; m5?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number; m5?: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
  info?: { imageUrl?: string };
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
};

const DEXSCREENER_CHAIN_ID = "robinhood";
const DEXSCREENER_BATCH_LIMIT = 25;

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function toDexTokenAddress(address: string) {
  const normalized = normalizeTokenAddress(address);
  return normalized.toLowerCase() === ETH_ADDRESS.toLowerCase() ? WETH_ADDRESS : normalized;
}

async function fetchDexJson<T>(url: string, revalidate = 30): Promise<T | null> {
  try {
    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function scorePair(pair: DexPair) {
  return (pair.liquidity?.usd ?? 0) + (pair.volume?.h24 ?? 0);
}

function pairIncludesToken(pair: DexPair, tokenAddress: string) {
  const target = tokenAddress.toLowerCase();
  return (
    pair.baseToken.address.toLowerCase() === target ||
    pair.quoteToken.address.toLowerCase() === target
  );
}

function selectBestPairForToken(tokenAddress: string, pairs: DexPair[]) {
  return [...pairs]
    .filter((pair) => pairIncludesToken(pair, tokenAddress))
    .sort((left, right) => scorePair(right) - scorePair(left))[0];
}

function pairTokenUsdPrice(pair: DexPair, tokenAddress: string) {
  const target = tokenAddress.toLowerCase();

  if (pair.baseToken.address.toLowerCase() === target) {
    const priceUsd = Number(pair.priceUsd ?? 0);
    return Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : null;
  }

  if (pair.quoteToken.address.toLowerCase() === target) {
    const baseUsd = Number(pair.priceUsd ?? 0);
    const baseNative = Number(pair.priceNative ?? 0);
    if (Number.isFinite(baseUsd) && Number.isFinite(baseNative) && baseUsd > 0 && baseNative > 0) {
      return baseUsd / baseNative;
    }
  }

  return null;
}

async function getDexPairsForAddresses(addresses: string[]) {
  const uniqueAddresses = Array.from(
    new Set(addresses.map((address) => toDexTokenAddress(address).toLowerCase())),
  );
  const pairs: DexPair[] = [];

  for (const addressChunk of chunk(uniqueAddresses, DEXSCREENER_BATCH_LIMIT)) {
    const payload = await fetchDexJson<DexPair[]>(
      `https://api.dexscreener.com/tokens/v1/${DEXSCREENER_CHAIN_ID}/${addressChunk.join(",")}`,
    );

    if (payload?.length) {
      pairs.push(...payload);
    }
  }

  return pairs.filter((pair) => pair.chainId === DEXSCREENER_CHAIN_ID);
}

async function getDexScreenerPrices(
  tokens: { address: string; symbol: string }[],
): Promise<Record<string, DexPrice>> {
  const result: Record<string, DexPrice> = {};
  const pairs = await getDexPairsForAddresses(tokens.map((token) => token.address));

  for (const token of tokens) {
    const requestedAddress = token.address.toLowerCase();
    const dexAddress = toDexTokenAddress(token.address).toLowerCase();
    const pair = selectBestPairForToken(dexAddress, pairs);
    const usdPrice = pair ? pairTokenUsdPrice(pair, dexAddress) : null;

    result[requestedAddress] = {
      usd:
        usdPrice ??
        (token.symbol === "ETH" || token.symbol === "WETH"
          ? 3500
          : token.symbol === "USDC"
            ? 1
            : 0),
      usd_24h_change: pair?.priceChange?.h24 ?? 0,
      usd_24h_vol: pair?.volume?.h24 ?? 0,
      market_cap: pair?.marketCap ?? pair?.fdv ?? 0,
    };
  }

  return result;
}

export async function getMarketRows(addresses: string[] = []): Promise<MarketRow[]> {
  const requestedAddresses =
    addresses.length > 0 ? addresses : FEATURED_TOKENS.map((token) => token.address);

  const uniqueRequested = Array.from(
    new Set(requestedAddresses.map((address) => normalizeTokenAddress(address).toLowerCase())),
  );
  const dexPairs = await getDexPairsForAddresses(uniqueRequested);
  const metadataEntries = await Promise.all(
    uniqueRequested.map(async (address) => {
      if (address === ETH_ADDRESS.toLowerCase()) {
        return {
          address,
          token: FEATURED_TOKENS.find(
            (token) => token.address.toLowerCase() === ETH_ADDRESS.toLowerCase(),
          ),
        };
      }

      try {
        const metadata = await resolveTokenMetadata(address);
        return { address, token: metadata.token };
      } catch {
        return { address, token: undefined };
      }
    }),
  );

  const metadataByAddress = new Map(metadataEntries.map((entry) => [entry.address, entry.token]));

  return uniqueRequested.map((requestedAddress) => {
    const dexAddress = toDexTokenAddress(requestedAddress).toLowerCase();
    const pair = selectBestPairForToken(dexAddress, dexPairs);
    const token = metadataByAddress.get(requestedAddress);
    const fallbackToken =
      pair?.baseToken.address.toLowerCase() === dexAddress ? pair.baseToken : pair?.quoteToken;

    return {
      address: token?.address ?? requestedAddress,
      symbol:
        requestedAddress === ETH_ADDRESS.toLowerCase()
          ? "ETH"
          : (token?.symbol ??
            fallbackToken?.symbol ??
            `${requestedAddress.slice(0, 4)}…${requestedAddress.slice(-4)}`),
      name:
        requestedAddress === ETH_ADDRESS.toLowerCase()
          ? "Ethereum"
          : (token?.name ?? fallbackToken?.name ?? requestedAddress),
      decimals:
        token?.decimals ?? (requestedAddress === ETH_ADDRESS.toLowerCase() ? 18 : undefined),
      logoUri: pair?.info?.imageUrl,
      priceUsd: pair?.pairAddress
        ? pairTokenUsdPrice(pair, dexAddress)
        : requestedAddress === USDC_ADDRESS.toLowerCase()
          ? 1
          : requestedAddress === WETH_ADDRESS.toLowerCase()
            ? 3500
            : null,
      change24hPct:
        requestedAddress === USDC_ADDRESS.toLowerCase() ? 0 : (pair?.priceChange?.h24 ?? null),
      volume24hUsd: pair?.volume?.h24 ?? null,
      liquidityUsd: pair?.liquidity?.usd ?? null,
      marketCap: pair?.marketCap ?? pair?.fdv ?? null,
      pairAddress: pair?.pairAddress,
    };
  });
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
