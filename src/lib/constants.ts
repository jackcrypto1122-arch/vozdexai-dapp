// Robinhood Chain
export const ROBINHOOD_CHAIN_ID = 4663;
export const DEFAULT_RPC_URL =
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
export const DEFAULT_EXPLORER = "https://robinhoodchain.blockscout.com";

// Token addresses
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // Native ETH
export const V4_QUOTER_ADDRESS = "0x8dc178efb8111bb0973dd9d722ebeff267c98f94";
export const V4_POOL_MANAGER_ADDRESS = "0x8366a39cc670b4001a1121b8f6a443a643e40951";
export const V2_ROUTER_ADDRESS = "0x89e5db8b5aa49aa85ac63f691524311aeb649eba";
export const V3_FACTORY_ADDRESS = "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA";
export const V3_QUOTER_ADDRESS = "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7";
export const USDC_ADDRESS = "0x3884564BA51B349e7661c7e28Ad947DEE327FeDF";
export const RH_ADDRESS = "0x..."; // Placeholder for Robinhood token if available
export const WETH_ADDRESS = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
export const CASHCAT_ADDRESS = "0x020bfC650A365f8BB26819deAAbF3E21291018b4";
export const HOODRAT_ADDRESS = "0x8e62F281f282686fCa6dCB39288069a93fC23F1c";
export const JUGGERNAUT_ADDRESS = "0xD7321801CAae694090694Ff55A9323139F043B88";
export const ARROW_ADDRESS = "0xf2915d1e3C1B0c769d0c756Ec43F1c1f6c99cD03";

// Some Robinhood explorer links point to pool contracts instead of the underlying token.
// Normalize those pool addresses to the tradable token contract we actually want in the UI.
export const KNOWN_POOL_TO_TOKEN_ADDRESS: Record<string, string> = {
  "0xa70fc67c9f69da90b63a0e4c05d229954574e313": CASHCAT_ADDRESS, // Cash Cat/WETH Uniswap V3 pair
  "0x451c0da3b774045a822a129eedcc5c667dcbfdd8": HOODRAT_ADDRESS, // Hoodrat/WETH Uniswap V2 pair
  "0xe40d98d88038e0b844f844dce6ae3c79ec01ec53": ARROW_ADDRESS, // Arrow/WETH Uniswap V2 pair
  "0x588b0785f50063260003b7790c42f1ef74902746": JUGGERNAUT_ADDRESS, // Juggernaut/WETH Uniswap V3 pair
};

export const FEATURED_TOKENS = [
  {
    address: ETH_ADDRESS,
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    dexVersion: "v3",
    feeTier: 3000,
    logoUri: "/eth.png",
  },
  {
    address: WETH_ADDRESS,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    dexVersion: "v3",
    feeTier: 3000,
    logoUri: "/wrapper eth.png",
  },
  {
    address: USDC_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    dexVersion: "v3",
    feeTier: 3000,
    logoUri: "/USDC.png",
  },
  {
    address: ARROW_ADDRESS,
    symbol: "ARROW",
    name: "Arrow",
    decimals: 18,
    dexVersion: "v4",
    feeTier: 10000,
    tickSpacing: 200,
    hooks: "0x0000000000000000000000000000000000000000",
    logoUri: "/arrow.png",
  },
  {
    address: CASHCAT_ADDRESS,
    symbol: "CASHCAT",
    name: "Cash Cat",
    decimals: 18,
    dexVersion: "v3",
    feeTier: 10000,
    logoUri: "/cashcat.png",
  },
  {
    address: HOODRAT_ADDRESS,
    symbol: "HOODRAT",
    name: "Hoodrat",
    decimals: 18,
    dexVersion: "v2",
    logoUri: "/hoodrat.png",
  },
  {
    address: JUGGERNAUT_ADDRESS,
    symbol: "JUGGERNAUT",
    name: "The Juggernaut",
    decimals: 18,
    dexVersion: "v3",
    feeTier: 10000,
    logoUri: "/juggernaut.png",
  },
] as const;

export function normalizeTokenAddress(address: string) {
  return KNOWN_POOL_TO_TOKEN_ADDRESS[address.toLowerCase()] ?? address;
}

export const SYMBOL_TO_ADDRESS = Object.fromEntries(
  FEATURED_TOKENS.map((token) => [token.symbol, token.address]),
) as Record<string, string>;

export const ADDRESS_TO_SYMBOL = Object.fromEntries(
  FEATURED_TOKENS.map((token) => [token.address, token.symbol]),
) as Record<string, string>;

// DEX contracts – Uniswap on Robinhood Chain
export const UNIVERSAL_ROUTER_ADDRESS = "0x8876789976dEcBfCbBbe364623C63652db8C0904";
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const UNISWAP_V3_FEE_TIER = 3000; // 0.3%
