export type TokenInfo = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
};

export type TokenMetadataResponse = {
  token: TokenInfo;
  requestedAddress: string;
  resolvedAddress: string;
  resolvedFromPool: boolean;
  cacheHit: boolean;
};

export type WalletBalance = TokenInfo & {
  amountRaw: string;
  amountUi: number;
  usdPrice: number | null;
  usdValue: number | null;
  priceChange24hPct: number | null;
  isNativeEth: boolean;
};

export type PortfolioSummary = {
  walletAddress: string;
  totalUsdValue: number;
  holdings: WalletBalance[];
  topMovers: Array<{
    address: string;
    symbol: string;
    change24hPct: number | null;
    usdValue: number | null;
  }>;
};

export type MarketRow = {
  address: string;
  symbol: string;
  name: string;
  decimals?: number;
  logoUri?: string;
  priceUsd: number | null;
  change24hPct: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  marketCap: number | null;
  pairAddress?: string;
};

export type HistoryItem = {
  hash: string;
  status: "confirmed" | "failed" | "pending";
  blockNumber: number;
  timestamp: number | null;
  explorerUrl: string;
  label: string;
  kind: "swap" | "send" | "receive" | "stake" | "unknown";
};

export type Permit2Permit = {
  amount: string;
  expiration: number;
  nonce: number;
  sigDeadline: string;
  signature: string;
};
export type QuoteRequest = {
  inputAddress: string;
  outputAddress: string;
  amountRaw: string;
  slippageBps: number;
  walletAddress: string;
  permit2Permit?: Permit2Permit;
};

export type QuoteResponse = {
  inputAddress: string;
  outputAddress: string;
  inAmountRaw: string;
  outAmountRaw: string;
  outAmountUi: number;
  priceImpactPct: number;
  estimatedGas: string | null;
};

export type SwapBuildResponse = {
  to: string;
  data: string;
  value: string;
  gas: string;
  quote: QuoteResponse;
  approvalNeeded?: {
    token: string;
    spender: string;
    kind: "erc20";
  };
  permit2SignatureNeeded?: {
    token: string;
    spender: string;
    amount: string;
    expiration: number;
    nonce: number;
    sigDeadline: string;
  };
};

export type ExecutionStatus = {
  hash: string;
  status: "awaiting_signature" | "submitted" | "confirmed" | "failed";
  explorerUrl: string;
  error?: string;
  createdAt: string;
  inputSymbol?: string;
  outputSymbol?: string;
  inAmountUi?: number;
  outAmountUi?: number;
};

export type VoiceIntent = {
  action: "swap" | "buy" | "sell" | "send" | "stake" | "unknown";
  inputSymbol?: string;
  outputSymbol?: string;
  amount?: string;
  amountKind?: "token" | "usd";
  recipient?: string;
  confidence: number;
  requiresConfirmation: boolean;
};
