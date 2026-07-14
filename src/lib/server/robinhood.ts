import {
  createPublicClient,
  http,
  formatUnits,
  encodeFunctionData,
  encodeAbiParameters,
  concatHex,
  encodePacked,
  parseAbi,
  parseAbiItem,
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
  V4_QUOTER_ADDRESS,
  V4_POOL_MANAGER_ADDRESS,
  V2_ROUTER_ADDRESS,
  V3_FACTORY_ADDRESS,
  V3_QUOTER_ADDRESS,
  PERMIT2_ADDRESS,
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
const NATIVE_ETH_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const V4_SWAP_COMMAND = "0x10" as Hex;
const V4_ACTIONS = "0x070b0e" as Hex;
const V4_QUOTER_ABI = parseAbi([
  "function quoteExactInput((address exactCurrency,(address intermediateCurrency,uint24 fee,int24 tickSpacing,address hooks,bytes hookData)[] path,uint128 exactAmount) params) returns (uint256 amountOut,uint256 gasEstimate)",
]);
const V4_EXACT_IN_ABI = parseAbiParameters(
  "(address currencyIn, (address intermediateCurrency, uint24 fee, int24 tickSpacing, address hooks, bytes hookData)[] path, uint256[] minHopPriceX36, uint128 amountIn, uint128 amountOutMinimum) params",
);
const V4_SETTLE_ABI = parseAbiParameters("address currency, uint256 amount, bool payerIsUser");
const V4_TAKE_ABI = parseAbiParameters("address currency, address recipient, uint256 amount");
const V4_WRAPPER_ABI = parseAbiParameters("bytes actions, bytes[] params");
const ROUTER_ADDRESS_THIS = "0x0000000000000000000000000000000000000002" as const;
const WRAP_UNWRAP_ABI = parseAbiParameters("address recipient, uint256 amount");
const V2_SWAP_EXACT_IN_ABI = parseAbiParameters(
  "address recipient, uint256 amountIn, uint256 amountOutMinimum, address[] path, bool payerIsUser, uint256[] minHopPriceX36",
);
const V3_SWAP_EXACT_IN_ABI = parseAbiParameters(
  "address recipient, uint256 amountIn, uint256 amountOutMinimum, bytes path, bool payerIsUser, uint256[] minHopPriceX36",
);
const PERMIT2_PERMIT_COMMAND = "0x0a" as Hex;
const PERMIT2_PERMIT_INPUT_ABI = parseAbiParameters(
  "((address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline) permitSingle, bytes signature",
);
const MAX_UINT160 = (1n << 160n) - 1n;
const MAX_UINT48 = Number((1n << 48n) - 1n);
const PERMIT2_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
const V2_ROUTER_ABI = parseAbi([
  "function getAmountsOut(uint256 amountIn,address[] path) view returns (uint256[] amounts)",
]);
const V3_QUOTER_ABI = parseAbi([
  "function quoteExactInput(bytes path,uint256 amountIn) returns (uint256 amountOut,uint160[] sqrtPriceX96AfterList,uint32[] initializedTicksCrossedList,uint256 gasEstimate)",
]);
const V3_POOL_CREATED_EVENT = parseAbiItem(
  "event PoolCreated(address indexed token0,address indexed token1,uint24 indexed fee,int24 tickSpacing,address pool)",
);
const V4_POOL_INITIALIZE_EVENT = parseAbiItem(
  "event Initialize(bytes32 indexed id,address indexed currency0,address indexed currency1,uint24 fee,int24 tickSpacing,address hooks,uint160 sqrtPriceX96,int24 tick)",
);

type EvmAddress = `0x${string}`;

type V2Route = {
  protocol: "v2";
  amountOut: bigint;
  tokens: EvmAddress[];
};

type V3Route = {
  protocol: "v3";
  amountOut: bigint;
  tokens: EvmAddress[];
  fees: number[];
};

type V4PathKey = {
  intermediateCurrency: EvmAddress;
  fee: number;
  tickSpacing: number;
  hooks: EvmAddress;
  hookData: Hex;
};

type V4PoolKey = Omit<V4PathKey, "intermediateCurrency" | "hookData">;

type V4Route = {
  protocol: "v4";
  amountOut: bigint;
  currencyIn: EvmAddress;
  path: V4PathKey[];
};

type ResolvedSwapRoute = V2Route | V3Route | V4Route;

const swapRouteCache = new Map<string, { expiresAt: number; route: Promise<ResolvedSwapRoute> }>();

function sortPair(left: EvmAddress, right: EvmAddress): [EvmAddress, EvmAddress] {
  return BigInt(left) < BigInt(right) ? [left, right] : [right, left];
}

function encodeV3Path(tokens: EvmAddress[], fees: number[]): Hex {
  let path = tokens[0] as Hex;
  for (let index = 0; index < fees.length; index += 1) {
    path = concatHex([path, encodePacked(["uint24", "address"], [fees[index], tokens[index + 1]])]);
  }
  return path;
}

async function quoteV2Routes(
  amountIn: bigint,
  wrappedIn: EvmAddress,
  wrappedOut: EvmAddress,
): Promise<V2Route[]> {
  const publicClient = getPublicClient();
  const paths: EvmAddress[][] = [[wrappedIn, wrappedOut]];
  if (
    wrappedIn.toLowerCase() !== USDC_ADDRESS.toLowerCase() &&
    wrappedOut.toLowerCase() !== USDC_ADDRESS.toLowerCase()
  ) {
    paths.push([wrappedIn, USDC_ADDRESS as EvmAddress, wrappedOut]);
  }

  const routes = await Promise.all(
    paths.map(async (tokens): Promise<V2Route | undefined> => {
      try {
        const amounts = await publicClient.readContract({
          address: V2_ROUTER_ADDRESS,
          abi: V2_ROUTER_ABI,
          functionName: "getAmountsOut",
          args: [amountIn, tokens],
        });
        const amountOut = amounts.at(-1);
        return amountOut && amountOut > 0n ? { protocol: "v2", amountOut, tokens } : undefined;
      } catch {
        return undefined;
      }
    }),
  );
  return routes.filter((route): route is V2Route => Boolean(route));
}

async function findV3Fees(tokenA: EvmAddress, tokenB: EvmAddress): Promise<number[]> {
  const publicClient = getPublicClient();
  const [token0, token1] = sortPair(tokenA, tokenB);
  try {
    const logs = await publicClient.getLogs({
      address: V3_FACTORY_ADDRESS,
      event: V3_POOL_CREATED_EVENT,
      args: { token0, token1 },
      fromBlock: 0n,
      toBlock: "latest",
    });
    return [...new Set(logs.map((log) => log.args.fee).filter((fee) => fee != null))];
  } catch {
    return [];
  }
}

async function quoteV3Routes(
  amountIn: bigint,
  wrappedIn: EvmAddress,
  wrappedOut: EvmAddress,
): Promise<V3Route[]> {
  const tokenPaths: EvmAddress[][] = [[wrappedIn, wrappedOut]];
  if (
    wrappedIn.toLowerCase() !== USDC_ADDRESS.toLowerCase() &&
    wrappedOut.toLowerCase() !== USDC_ADDRESS.toLowerCase()
  ) {
    tokenPaths.push([wrappedIn, USDC_ADDRESS as EvmAddress, wrappedOut]);
  }

  const publicClient = getPublicClient();
  const routeCandidates: Array<{ tokens: EvmAddress[]; fees: number[] }> = [];
  for (const tokens of tokenPaths) {
    const feesByHop = await Promise.all(
      tokens.slice(0, -1).map((token, index) => findV3Fees(token, tokens[index + 1])),
    );
    if (feesByHop.some((fees) => fees.length === 0)) continue;

    let combinations: number[][] = [[]];
    for (const fees of feesByHop) {
      combinations = combinations.flatMap((combination) =>
        fees.map((fee) => [...combination, fee]),
      );
    }
    for (const fees of combinations.slice(0, 36)) routeCandidates.push({ tokens, fees });
  }

  const routes = await Promise.all(
    routeCandidates.map(async ({ tokens, fees }): Promise<V3Route | undefined> => {
      try {
        const { result } = await publicClient.simulateContract({
          address: V3_QUOTER_ADDRESS,
          abi: V3_QUOTER_ABI,
          functionName: "quoteExactInput",
          args: [encodeV3Path(tokens, fees), amountIn],
        });
        return result[0] > 0n ? { protocol: "v3", amountOut: result[0], tokens, fees } : undefined;
      } catch {
        return undefined;
      }
    }),
  );
  return routes.filter((route): route is V3Route => Boolean(route));
}

async function findV4Pools(currencyA: EvmAddress, currencyB: EvmAddress): Promise<V4PoolKey[]> {
  const publicClient = getPublicClient();
  const [currency0, currency1] = sortPair(currencyA, currencyB);
  try {
    const logs = await publicClient.getLogs({
      address: V4_POOL_MANAGER_ADDRESS,
      event: V4_POOL_INITIALIZE_EVENT,
      args: { currency0, currency1 },
      fromBlock: 0n,
      toBlock: "latest",
    });
    return logs
      .map((log) => ({
        fee: log.args.fee,
        tickSpacing: log.args.tickSpacing,
        hooks: log.args.hooks,
      }))
      .filter(
        (
          pool,
        ): pool is {
          fee: number;
          tickSpacing: number;
          hooks: EvmAddress;
        } => pool.fee != null && pool.tickSpacing != null && Boolean(pool.hooks),
      );
  } catch {
    return [];
  }
}

async function quoteV4Routes(
  request: QuoteRequest,
  tokenIn: EvmAddress,
  tokenOut: EvmAddress,
): Promise<V4Route[]> {
  const isNativeIn = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase();
  const currencyIn = isNativeIn ? NATIVE_ETH_ADDRESS : tokenIn;
  const currencyOut =
    tokenOut.toLowerCase() === ETH_ADDRESS.toLowerCase() ? NATIVE_ETH_ADDRESS : tokenOut;
  const currencyPaths: EvmAddress[][] = [[currencyIn, currencyOut]];
  if (
    currencyIn.toLowerCase() !== USDC_ADDRESS.toLowerCase() &&
    currencyOut.toLowerCase() !== USDC_ADDRESS.toLowerCase()
  ) {
    currencyPaths.push([currencyIn, USDC_ADDRESS as EvmAddress, currencyOut]);
  }

  const routeCandidates: V4PathKey[][] = [];
  for (const currencies of currencyPaths) {
    const poolsByHop = await Promise.all(
      currencies
        .slice(0, -1)
        .map((currency, index) => findV4Pools(currency, currencies[index + 1])),
    );
    if (poolsByHop.some((pools) => pools.length === 0)) continue;

    let combinations: V4PoolKey[][] = [[]];
    for (const pools of poolsByHop) {
      combinations = combinations.flatMap((combination) =>
        pools.map((pool) => [...combination, pool]),
      );
    }
    for (const combination of combinations.slice(0, 36)) {
      routeCandidates.push(
        combination.map((pool, index) => ({
          intermediateCurrency: currencies[index + 1],
          fee: pool.fee,
          tickSpacing: pool.tickSpacing,
          hooks: pool.hooks,
          hookData: "0x",
        })),
      );
    }
  }

  const publicClient = getPublicClient();
  const routes = await Promise.all(
    routeCandidates.map(async (path): Promise<V4Route | undefined> => {
      try {
        const { result } = await publicClient.simulateContract({
          account: request.walletAddress as EvmAddress,
          address: V4_QUOTER_ADDRESS,
          abi: V4_QUOTER_ABI,
          functionName: "quoteExactInput",
          args: [
            {
              exactCurrency: currencyIn,
              path,
              exactAmount: BigInt(request.amountRaw),
            },
          ],
        });
        return result[0] > 0n
          ? { protocol: "v4", amountOut: result[0], currencyIn, path }
          : undefined;
      } catch {
        return undefined;
      }
    }),
  );
  return routes.filter((route): route is V4Route => Boolean(route));
}
async function discoverBestRoute(
  request: QuoteRequest,
  tokenIn: EvmAddress,
  tokenOut: EvmAddress,
): Promise<ResolvedSwapRoute> {
  const isNativeIn = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase();
  const isNativeOut = tokenOut.toLowerCase() === ETH_ADDRESS.toLowerCase();
  if (isNativeIn === isNativeOut) {
    throw new Error("RPC routing currently requires exactly one native ETH side.");
  }

  const amountIn = BigInt(request.amountRaw);
  const wrappedIn = isNativeIn ? (WETH_ADDRESS as EvmAddress) : tokenIn;
  const wrappedOut = isNativeOut ? (WETH_ADDRESS as EvmAddress) : tokenOut;
  const routeGroups = await Promise.all([
    quoteV2Routes(amountIn, wrappedIn, wrappedOut),
    quoteV3Routes(amountIn, wrappedIn, wrappedOut),
    quoteV4Routes(request, tokenIn, tokenOut),
  ]);
  const routes = routeGroups
    .flat()
    .sort((left, right) =>
      left.amountOut === right.amountOut ? 0 : left.amountOut > right.amountOut ? -1 : 1,
    );
  if (!routes[0]) {
    throw new Error("No executable V2, V3, or V4 route with sufficient liquidity was found.");
  }
  return routes[0];
}

async function resolveBestRoute(
  request: QuoteRequest,
  tokenIn: EvmAddress,
  tokenOut: EvmAddress,
): Promise<ResolvedSwapRoute> {
  const key = [
    tokenIn.toLowerCase(),
    tokenOut.toLowerCase(),
    request.amountRaw,
    request.walletAddress.toLowerCase(),
  ].join(":");
  const cached = swapRouteCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.route;

  const route = discoverBestRoute(request, tokenIn, tokenOut);
  swapRouteCache.set(key, { expiresAt: Date.now() + 15_000, route });
  try {
    return await route;
  } catch (error) {
    swapRouteCache.delete(key);
    throw error;
  }
}
export async function getQuote(request: QuoteRequest): Promise<QuoteResponse> {
  const inputMetadata = await resolveTokenMetadata(request.inputAddress);
  const outputMetadata = await resolveTokenMetadata(request.outputAddress);
  const tokenIn = inputMetadata.token.address as `0x${string}`;
  const tokenOut = outputMetadata.token.address as `0x${string}`;
  const tokenOutInfo =
    FEATURED_TOKENS.find((token) => token.address.toLowerCase() === tokenOut.toLowerCase()) ??
    outputMetadata.token;
  const route = await resolveBestRoute(request, tokenIn, tokenOut);

  return {
    inputAddress: tokenIn,
    outputAddress: tokenOut,
    inAmountRaw: request.amountRaw,
    outAmountRaw: route.amountOut.toString(),
    outAmountUi: Number(formatUnits(route.amountOut, tokenOutInfo?.decimals ?? 18)),
    priceImpactPct: 0,
    estimatedGas: null,
  };
}
export async function buildSwap(request: QuoteRequest): Promise<SwapBuildResponse> {
  const quote = await getQuote(request);
  const inputMetadata = await resolveTokenMetadata(request.inputAddress);
  const outputMetadata = await resolveTokenMetadata(request.outputAddress);
  const tokenIn = inputMetadata.token.address as `0x${string}`;
  const tokenOut = outputMetadata.token.address as `0x${string}`;
  const amountIn = BigInt(request.amountRaw);
  const amountOutMinimum =
    (BigInt(quote.outAmountRaw) * BigInt(10000 - request.slippageBps)) / 10000n;
  const recipient = request.walletAddress as `0x${string}`;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  const isNativeIn = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase();
  const route = await resolveBestRoute(request, tokenIn, tokenOut);
  let commands: Hex;
  let inputs: Hex[];
  let value = 0n;

  if (route.protocol === "v4") {
    const currencyOut = route.path.at(-1)?.intermediateCurrency;
    if (!currencyOut) throw new Error("The selected V4 route has no output currency.");

    const swapParams = encodeAbiParameters(V4_EXACT_IN_ABI, [
      {
        currencyIn: route.currencyIn,
        path: route.path,
        minHopPriceX36: [],
        amountIn,
        amountOutMinimum,
      },
    ]);
    const settleParams = encodeAbiParameters(V4_SETTLE_ABI, [route.currencyIn, 0n, true]);
    const takeParams = encodeAbiParameters(V4_TAKE_ABI, [currencyOut, recipient, 0n]);
    const routerInput = encodeAbiParameters(V4_WRAPPER_ABI, [
      V4_ACTIONS,
      [swapParams, settleParams, takeParams],
    ]);
    commands = V4_SWAP_COMMAND;
    inputs = [routerInput];
    value = isNativeIn ? amountIn : 0n;
  } else {
    const swapRecipient = isNativeIn ? recipient : ROUTER_ADDRESS_THIS;
    const payerIsUser = !isNativeIn;

    const swapInput =
      route.protocol === "v2"
        ? encodeAbiParameters(V2_SWAP_EXACT_IN_ABI, [
            swapRecipient,
            amountIn,
            amountOutMinimum,
            route.tokens,
            payerIsUser,
            [],
          ])
        : encodeAbiParameters(V3_SWAP_EXACT_IN_ABI, [
            swapRecipient,
            amountIn,
            amountOutMinimum,
            encodeV3Path(route.tokens, route.fees),
            payerIsUser,
            [],
          ]);

    if (isNativeIn) {
      commands = route.protocol === "v2" ? "0x0b08" : "0x0b00";
      inputs = [encodeAbiParameters(WRAP_UNWRAP_ABI, [ROUTER_ADDRESS_THIS, amountIn]), swapInput];
      value = amountIn;
    } else {
      commands = route.protocol === "v2" ? "0x080c" : "0x000c";
      inputs = [swapInput, encodeAbiParameters(WRAP_UNWRAP_ABI, [recipient, amountOutMinimum])];
    }
  }

  const publicClient = getPublicClient();

  let approvalNeeded: SwapBuildResponse["approvalNeeded"];
  let permit2SignatureNeeded: SwapBuildResponse["permit2SignatureNeeded"];
  if (!isNativeIn) {
    const [tokenBalance, tokenAllowance] = await Promise.all([
      publicClient.readContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [recipient],
      }),
      publicClient.readContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [recipient, PERMIT2_ADDRESS as `0x${string}`],
      }),
    ]);

    if (tokenBalance < amountIn) {
      throw new Error(
        `Insufficient ${inputMetadata.token.symbol} balance: available ${formatUnits(tokenBalance, inputMetadata.token.decimals)}, requested ${formatUnits(amountIn, inputMetadata.token.decimals)}.`,
      );
    }

    if (tokenAllowance < amountIn) {
      approvalNeeded = {
        token: tokenIn,
        spender: PERMIT2_ADDRESS,
        kind: "erc20",
      };
    } else {
      const permitAllowance = await publicClient.readContract({
        address: PERMIT2_ADDRESS as `0x${string}`,
        abi: PERMIT2_ABI,
        functionName: "allowance",
        args: [recipient, tokenIn, UNIVERSAL_ROUTER_ADDRESS as `0x${string}`],
      });
      const currentPermitAmount = BigInt(permitAllowance[0]);
      const currentPermitExpiration = Number(permitAllowance[1]);
      const currentPermitNonce = Number(permitAllowance[2]);
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (currentPermitAmount < amountIn || currentPermitExpiration <= nowSeconds + 300) {
        const suppliedPermit = request.permit2Permit;
        if (!suppliedPermit) {
          permit2SignatureNeeded = {
            token: tokenIn,
            spender: UNIVERSAL_ROUTER_ADDRESS,
            amount: MAX_UINT160.toString(),
            expiration: MAX_UINT48,
            nonce: currentPermitNonce,
            sigDeadline: String(nowSeconds + 600),
          };
        } else {
          const suppliedAmount = BigInt(suppliedPermit.amount);
          const suppliedSigDeadline = BigInt(suppliedPermit.sigDeadline);
          if (
            suppliedAmount < amountIn ||
            suppliedPermit.expiration <= nowSeconds + 300 ||
            suppliedPermit.nonce !== currentPermitNonce ||
            suppliedSigDeadline <= BigInt(nowSeconds)
          ) {
            throw new Error("The Permit2 signature request expired. Please try Swap again.");
          }

          const permitInput = encodeAbiParameters(PERMIT2_PERMIT_INPUT_ABI, [
            {
              details: {
                token: tokenIn,
                amount: suppliedAmount,
                expiration: suppliedPermit.expiration,
                nonce: suppliedPermit.nonce,
              },
              spender: UNIVERSAL_ROUTER_ADDRESS as `0x${string}`,
              sigDeadline: suppliedSigDeadline,
            },
            suppliedPermit.signature as Hex,
          ]);
          commands = concatHex([PERMIT2_PERMIT_COMMAND, commands]);
          inputs = [permitInput, ...inputs];
        }
      }
    }
  }

  const data = encodeFunctionData({
    abi: UNIVERSAL_ROUTER_ABI,
    functionName: "execute",
    args: [commands, inputs, deadline],
  });
  let gas = 350000n;
  if (!approvalNeeded && !permit2SignatureNeeded) {
    try {
      const estimatedGas = await publicClient.estimateGas({
        account: recipient,
        to: UNIVERSAL_ROUTER_ADDRESS as `0x${string}`,
        data,
        value,
      });
      gas = (estimatedGas * 120n) / 100n;
      if (gas < 160000n) gas = 160000n;
    } catch (error) {
      const reason = error instanceof Error ? error.message.split("\n")[0] : "Unknown revert";
      throw new Error(`Robinhood swap simulation failed: ${reason}`);
    }
  }

  return {
    to: UNIVERSAL_ROUTER_ADDRESS,
    data,
    value: value.toString(),
    gas: gas.toString(),
    quote: { ...quote, estimatedGas: gas.toString() },
    approvalNeeded,
    permit2SignatureNeeded,
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
