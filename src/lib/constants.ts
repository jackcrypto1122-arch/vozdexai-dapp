// Robinhood Chain
export const ROBINHOOD_CHAIN_ID = 4663;
export const DEFAULT_RPC_URL =
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
export const DEFAULT_EXPLORER = "https://robinhoodchain.blockscout.com";

// Token addresses
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // Native ETH
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
  { address: ETH_ADDRESS, symbol: "ETH", name: "Ethereum", decimals: 18 },
  { address: WETH_ADDRESS, symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  { address: USDC_ADDRESS, symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: ARROW_ADDRESS, symbol: "ARROW", name: "Arrow", decimals: 18 },
  { address: CASHCAT_ADDRESS, symbol: "CASHCAT", name: "Cash Cat", decimals: 18 },
  { address: HOODRAT_ADDRESS, symbol: "HOODRAT", name: "Hoodrat", decimals: 18 },
  { address: JUGGERNAUT_ADDRESS, symbol: "JUGGERNAUT", name: "The Juggernaut", decimals: 18 },
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

// DEX contracts (placeholder - replace with actual Router/Quoter on Robinhood Chain)
export const UNISWAP_V3_QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
export const UNISWAP_V3_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
export const UNISWAP_V3_FEE_TIER = 3000; // 0.3%
