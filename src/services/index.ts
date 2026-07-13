// Placeholder API layer. Backend integrations (Solana / Jupiter / voice AI)
// plug in here. All functions return promises so call sites can be wired
// without changing component code.

import type {
  Wallet,
  Portfolio,
  Market,
  Order,
  HistoryEntry,
  Quote,
  Intent,
  SwapRequest,
  SwapResult,
} from "@/types";

// TODO: Connect backend API here
export async function getQuote(_req: SwapRequest): Promise<Quote | null> {
  return null;
}

// TODO: Connect backend API here
export async function executeSwap(_req: SwapRequest): Promise<SwapResult | null> {
  return null;
}

// TODO: Connect backend API here
export async function getWallet(): Promise<Wallet | null> {
  return null;
}

// TODO: Connect backend API here
export async function getPortfolio(): Promise<Portfolio | null> {
  return null;
}

// TODO: Connect backend API here
export async function getBalances(): Promise<Record<string, number>> {
  return {};
}

// TODO: Connect backend API here
export async function getMarkets(): Promise<Market[]> {
  return [];
}

// TODO: Connect backend API here
export async function getOrders(): Promise<Order[]> {
  return [];
}

// TODO: Connect backend API here
export async function getHistory(): Promise<HistoryEntry[]> {
  return [];
}

// TODO: Connect voice transcription backend here
export async function transcribeVoice(_blob: Blob): Promise<string> {
  return "";
}

// TODO: Connect intent parser here
export async function parseIntent(_transcript: string): Promise<Intent | null> {
  return null;
}

// TODO: Connect AI swap generator here
export async function generateSwap(_intent: Intent): Promise<SwapRequest | null> {
  return null;
}

// TODO: Connect voice-execution orchestrator here
export async function executeVoiceIntent(_intent: Intent): Promise<SwapResult | null> {
  return null;
}
