export type Wallet = {
  address: string;
  network: string;
  connected: boolean;
};

export type Token = {
  symbol: string;
  name: string;
  network: string;
  decimals: number;
};

export type Portfolio = {
  totalUsd: number;
  pnl24hUsd: number;
  allocations: Array<{ symbol: string; usd: number; pct: number }>;
};

export type Market = {
  symbol: string;
  priceUsd: number;
  change24h: number;
  volume24hUsd: number;
};

export type Order = {
  id: string;
  kind: "limit" | "dca" | "recurring";
  status: "open" | "completed" | "cancelled";
  from: string;
  to: string;
  amount: number;
  createdAt: string;
};

export type HistoryEntry = {
  id: string;
  kind: "swap" | "bridge" | "stake" | "receive" | "send" | "voice";
  summary: string;
  createdAt: string;
};

export type Quote = {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  priceImpact: number;
  route: string[];
  networkFee: number;
};

export type Intent = {
  action: "swap" | "buy" | "sell" | "bridge" | "stake" | "send";
  fromSymbol?: string;
  toSymbol?: string;
  amount?: number;
  recipient?: string;
  confidence: number;
};

export type SwapRequest = {
  fromSymbol: string;
  toSymbol: string;
  amount: number;
  slippageBps?: number;
};

export type SwapResult = {
  txHash: string;
  status: "pending" | "confirmed" | "failed";
};
