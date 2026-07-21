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
export const PONS_ADDRESS = "0x39dBED3a2bd333467115dE45665cC57F813C4571";
export const WOOD_ADDRESS = "0xF8BC08092C06dB6148114DCf82AF881F1085f92b";
export const INDEX_ADDRESS = "0x56910D4409F3a0C78C64DD8D0545FF0705389870";
export const CASHCAT_ADDRESS = "0x020bfC650A365f8BB26819deAAbF3E21291018b4";
export const HOODRAT_ADDRESS = "0x8e62F281f282686fCa6dCB39288069a93fC23F1c";
export const JUGGERNAUT_ADDRESS = "0xD7321801CAae694090694Ff55A9323139F043B88";
export const ARROW_ADDRESS = "0xf2915d1e3C1B0c769d0c756Ec43F1c1f6c99cD03";
export const AAPL_ADDRESS = "0xaf3d76f1834a1d425780943c99ea8a608f8a93f9";
export const AMD_ADDRESS = "0x86923f96303d656e4aa86d9d42d1e57ad2023fdc";
export const AMZN_ADDRESS = "0x12f190a9f9d7d37a250758b26824b97ce941bf54";
export const COIN_ADDRESS = "0x6330d8c3178a418788df01a47479c0ce7ccf450b";
export const CRWV_ADDRESS = "0x5f10a1c971b69e47e059e1dc91901b59b3fb49c3";
export const GOOGL_ADDRESS = "0x2e0847e8910a9732eb3fb1bb4b70a580adad4fe3";
export const INTC_ADDRESS = "0xc72b96e0e48ecd4dc75e1e45396e26300bc39681";
export const META_ADDRESS = "0xc0d6457c16cc70d6790dd43521c899c87ce02f35";
export const MSFT_ADDRESS = "0xe93237c50d904957cf27e7b1133b510c669c2e74";
export const MU_ADDRESS = "0xff080c8ce2e5feadaca0da81314ae59d232d4afd";
export const NVDA_ADDRESS = "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec";
export const ORCL_ADDRESS = "0xb0992820e760d836549ba69bc7598b4af75dee03";
export const PLTR_ADDRESS = "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a";
export const SNDK_ADDRESS = "0xb90a19ff0af67f7779aff50a882a9cff42446400";
export const TSLA_ADDRESS = "0x322f0929c4625ed5bad873c95208d54e1c003b2d";
export const USAR_ADDRESS = "0xd917b029c761d264c6a312bbbcda868658ef86a6";

// Some Robinhood explorer links point to pool contracts or V4 pool ids instead of the
// underlying token. Normalize those identifiers to the tradable token contract we want in the UI.
export const KNOWN_POOL_TO_TOKEN_ADDRESS: Record<string, string> = {
  "0xa70fc67c9f69da90b63a0e4c05d229954574e313": CASHCAT_ADDRESS, // Cash Cat/WETH Uniswap V3 pair
  "0x451c0da3b774045a822a129eedcc5c667dcbfdd8": HOODRAT_ADDRESS, // Hoodrat/WETH Uniswap V2 pair
  "0xe40d98d88038e0b844f844dce6ae3c79ec01ec53": ARROW_ADDRESS, // Arrow/WETH Uniswap V2 pair
  "0x588b0785f50063260003b7790c42f1ef74902746": JUGGERNAUT_ADDRESS, // Juggernaut/WETH Uniswap V3 pair
  "0x10cc6bd38112cac182db90b6a71d8bb5939526ba": PONS_ADDRESS, // PONS/WETH pool
  "0xbf3bb81de6285b8310a028d1c2cd38f9419d54c1": WOOD_ADDRESS, // WOOD/WETH Uniswap V2 pair
  "0x00dd2df2f17d431cf3a0938f06c9cf9abc5e9643b6cc466ca3f71f3af246edf3": INDEX_ADDRESS, // INDEX/ETH Uniswap V4 pool id
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
    address: PONS_ADDRESS,
    symbol: "PONS",
    name: "Pons",
    decimals: 18,
    logoUri: "/pons.png",
  },
  {
    address: WOOD_ADDRESS,
    symbol: "WOOD",
    name: "Sherwood Protocol",
    decimals: 18,
    logoUri: "/wood.png",
  },
  {
    address: INDEX_ADDRESS,
    symbol: "INDEX",
    name: "The Index",
    decimals: 18,
    logoUri: "/index.png",
  },
  {
    address: AAPL_ADDRESS,
    symbol: "AAPL",
    name: "Apple",
    decimals: 18,
    logoUri: "/apple.png",
  },
  {
    address: AMD_ADDRESS,
    symbol: "AMD",
    name: "AMD",
    decimals: 18,
    logoUri: "/amd.png",
  },
  {
    address: AMZN_ADDRESS,
    symbol: "AMZN",
    name: "Amazon",
    decimals: 18,
    logoUri: "/amazon.png",
  },
  {
    address: COIN_ADDRESS,
    symbol: "COIN",
    name: "Coinbase",
    decimals: 18,
    logoUri: "/coinbase.png",
  },
  {
    address: CRWV_ADDRESS,
    symbol: "CRWV",
    name: "CoreWeave",
    decimals: 18,
    logoUri: "/coreweave.png",
  },
  {
    address: GOOGL_ADDRESS,
    symbol: "GOOGL",
    name: "Alphabet Class A",
    decimals: 18,
    logoUri: "/googl.png",
  },
  {
    address: INTC_ADDRESS,
    symbol: "INTC",
    name: "Intel",
    decimals: 18,
    logoUri: "/intel.png",
  },
  {
    address: META_ADDRESS,
    symbol: "META",
    name: "Meta Platforms",
    decimals: 18,
    logoUri: "/meta.png",
  },
  {
    address: MSFT_ADDRESS,
    symbol: "MSFT",
    name: "Microsoft",
    decimals: 18,
    logoUri: "/microsoft.png",
  },
  {
    address: MU_ADDRESS,
    symbol: "MU",
    name: "Micron Technology",
    decimals: 18,
    logoUri: "/micron.png",
  },
  {
    address: NVDA_ADDRESS,
    symbol: "NVDA",
    name: "NVIDIA",
    decimals: 18,
    logoUri: "/nvidia.png",
  },
  {
    address: ORCL_ADDRESS,
    symbol: "ORCL",
    name: "Oracle",
    decimals: 18,
    logoUri: "/oracle.png",
  },
  {
    address: PLTR_ADDRESS,
    symbol: "PLTR",
    name: "Palantir Technologies",
    decimals: 18,
    logoUri: "/palantir.png",
  },
  {
    address: SNDK_ADDRESS,
    symbol: "SNDK",
    name: "Sandisk Corporation",
    decimals: 18,
    logoUri: "/sandisk.png",
  },
  {
    address: TSLA_ADDRESS,
    symbol: "TSLA",
    name: "Tesla",
    decimals: 18,
    logoUri: "/tesla.png",
  },
  {
    address: USAR_ADDRESS,
    symbol: "USAR",
    name: "USA Rare Earth",
    decimals: 18,
    logoUri: "/usa rare earth.png",
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

export const STOCK_TOKEN_ADDRESSES = [
  AAPL_ADDRESS,
  AMD_ADDRESS,
  AMZN_ADDRESS,
  COIN_ADDRESS,
  CRWV_ADDRESS,
  GOOGL_ADDRESS,
  INTC_ADDRESS,
  META_ADDRESS,
  MSFT_ADDRESS,
  MU_ADDRESS,
  NVDA_ADDRESS,
  ORCL_ADDRESS,
  PLTR_ADDRESS,
  SNDK_ADDRESS,
  TSLA_ADDRESS,
  USAR_ADDRESS,
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
