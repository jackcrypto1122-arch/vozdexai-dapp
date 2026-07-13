import { SYMBOL_TO_ADDRESS } from "@/lib/constants";
import type { VoiceIntent } from "@/types/dapp";

const SYMBOL_ALIASES: Record<string, string> = {
  eth: "ETH",
  ethereum: "ETH",
  ether: "ETH",
  usd: "USDC",
  usdc: "USDC",
  "usd coin": "USDC",
};

const TOKEN_NAME_PATTERN = /[a-zA-Z]+(?:\s+(?!to\b|for\b|into\b|with\b)[a-zA-Z]+)?/;

function normalizeSymbol(symbol?: string) {
  if (!symbol) {
    return undefined;
  }

  const normalized = symbol.trim().toLowerCase().replace(/\s+/g, " ");
  return SYMBOL_ALIASES[normalized] ?? normalized.toUpperCase();
}

export function parseVoiceIntent(transcript: string): VoiceIntent {
  const normalized = transcript.trim().replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();

  const swapPattern = new RegExp(
    `(?:swap|buy|sell)\\s+([\\d.]+)\\s+(${TOKEN_NAME_PATTERN.source})(?:\\s+(?:to|for|into|with)\\s+(${TOKEN_NAME_PATTERN.source}))?$`,
  );
  const swapMatch = lower.match(swapPattern);

  if (swapMatch) {
    const [, amount, source, target] = swapMatch;
    const inputSymbol = normalizeSymbol(source);
    let outputSymbol = normalizeSymbol(target);
    const action = lower.startsWith("buy") ? "buy" : lower.startsWith("sell") ? "sell" : "swap";

    if (action === "buy") {
      outputSymbol = inputSymbol;
    }

    if (action === "sell" && !outputSymbol) {
      outputSymbol = "USDC";
    }

    return {
      action,
      inputSymbol,
      outputSymbol: outputSymbol && SYMBOL_TO_ADDRESS[outputSymbol] ? outputSymbol : outputSymbol,
      amount,
      amountKind: "token",
      confidence: 0.86,
      requiresConfirmation: true,
    };
  }

  const dollarPattern = new RegExp(
    `buy\\s+\\$?([\\d.]+)\\s+(?:of\\s+)?(${TOKEN_NAME_PATTERN.source})$`,
  );
  const dollarMatch = lower.match(dollarPattern);
  if (dollarMatch) {
    return {
      action: "buy",
      outputSymbol: normalizeSymbol(dollarMatch[2]),
      amount: dollarMatch[1],
      amountKind: "usd",
      inputSymbol: "USDC",
      confidence: 0.82,
      requiresConfirmation: true,
    };
  }

  const sendMatch = lower.match(/send\s+([\d.]+)\s*([a-zA-Z]+)\s+to\s+([a-zA-Z0-9._-]+)/);
  if (sendMatch) {
    return {
      action: "send",
      amount: sendMatch[1],
      inputSymbol: normalizeSymbol(sendMatch[2]),
      recipient: sendMatch[3],
      confidence: 0.74,
      requiresConfirmation: true,
    };
  }

  if (lower.includes("stake")) {
    return {
      action: "stake",
      confidence: 0.62,
      requiresConfirmation: true,
    };
  }

  return {
    action: "unknown",
    confidence: 0.2,
    requiresConfirmation: true,
  };
}
