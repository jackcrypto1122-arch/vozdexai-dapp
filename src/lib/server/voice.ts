import { FEATURED_TOKENS, SYMBOL_TO_ADDRESS } from "@/lib/constants";
import type { VoiceIntent } from "@/types/dapp";
import { z } from "zod";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = sanitizeBaseUrl(
  process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
);
const NVIDIA_MODEL_NAME = process.env.NVIDIA_MODEL_NAME ?? "meta/llama-3.1-8b-instruct";

const SYMBOL_ALIASES: Record<string, string> = {
  eth: "ETH",
  eat: "ETH",
  ethereum: "ETH",
  ether: "ETH",
  usd: "USDC",
  usdc: "USDC",
  "usd coin": "USDC",
};

const TOKEN_NAME_PATTERN = /[a-zA-Z]+(?:\s+(?!to\b|for\b|into\b|with\b)[a-zA-Z]+)?/;
const SUPPORTED_ACTIONS = [
  "swap",
  "buy",
  "sell",
  "send",
  "stake",
  "confirm",
  "cancel",
  "unknown",
] as const;
const MAX_AMOUNT_PATTERN =
  /\b(?:all|max|maximum|full(?:\s+balance)?|entire(?:\s+balance)?|whole(?:\s+balance)?)\b/i;
const TOKEN_ALIAS_ENTRIES = buildTokenAliasEntries();

const llmIntentSchema = z.object({
  action: z.enum(SUPPORTED_ACTIONS).optional(),
  inputSymbol: z.union([z.string(), z.null()]).optional(),
  outputSymbol: z.union([z.string(), z.null()]).optional(),
  amount: z.union([z.string(), z.number(), z.null()]).optional(),
  amountKind: z.enum(["token", "usd"]).nullable().optional(),
  recipient: z.union([z.string(), z.null()]).optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

function sanitizeBaseUrl(value: string) {
  return value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\/+$/, "");
}

function buildTokenAliasEntries() {
  const aliases = new Map<string, string>();

  for (const token of FEATURED_TOKENS) {
    const symbol = token.symbol.toUpperCase();
    const name = token.name.toLowerCase().replace(/\s+/g, " ").trim();
    const nameWithoutArticle = name.replace(/^the\s+/, "");
    const symbolAlias = token.symbol.toLowerCase();

    for (const alias of [
      symbolAlias,
      `${symbolAlias} token`,
      `${symbolAlias} tokens`,
      name,
      `${name} token`,
      `${name} tokens`,
      nameWithoutArticle,
      `${nameWithoutArticle} token`,
      `${nameWithoutArticle} tokens`,
    ]) {
      aliases.set(alias.trim(), symbol);
    }
  }

  for (const [alias, symbol] of Object.entries(SYMBOL_ALIASES)) {
    aliases.set(alias.toLowerCase(), symbol);
  }

  return [...aliases.entries()].sort((left, right) => right[0].length - left[0].length);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalizeTranscript(transcript: string) {
  let canonical = transcript
    .toLowerCase()
    .replace(/[^\w\s$.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [alias, symbol] of TOKEN_ALIAS_ENTRIES) {
    canonical = canonical.replace(
      new RegExp(`(^|\\s)${escapeRegExp(alias)}(?=\\s|$)`, "g"),
      `$1${symbol.toLowerCase()}`,
    );
  }

  return canonical;
}

function normalizeSymbol(symbol?: string) {
  if (!symbol) {
    return undefined;
  }

  const normalized = symbol
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

  if (
    !normalized ||
    normalized === "null" ||
    normalized === "undefined" ||
    normalized === "unknown"
  ) {
    return undefined;
  }

  const directMatch = SYMBOL_ALIASES[normalized];
  if (directMatch) {
    return directMatch;
  }

  const stripped = normalized
    .replace(/\b(tokens?|coins?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) {
    return undefined;
  }

  const strippedMatch = SYMBOL_ALIASES[stripped];
  if (strippedMatch) {
    return strippedMatch;
  }

  return stripped.toUpperCase();
}

function normalizeAmount(amount?: string | number | null) {
  if (amount == null) {
    return undefined;
  }

  const normalized = String(amount).trim().replace(/\s+/g, " ");
  if (!normalized) {
    return undefined;
  }

  if (MAX_AMOUNT_PATTERN.test(normalized)) {
    return "max";
  }

  return normalized.replace(/^\$/, "");
}

function normalizeVoiceIntent(
  parsed: z.infer<typeof llmIntentSchema>,
  fallbackConfidence: number,
): VoiceIntent {
  const action = parsed.action ?? "unknown";
  const amount = normalizeAmount(parsed.amount);
  let inputSymbol = normalizeSymbol(parsed.inputSymbol ?? undefined);
  let outputSymbol = normalizeSymbol(parsed.outputSymbol ?? undefined);

  if (action === "buy" && outputSymbol && !inputSymbol) {
    inputSymbol = "USDC";
  }

  if (action === "sell" && inputSymbol && !outputSymbol) {
    outputSymbol = "USDC";
  }

  return {
    action,
    inputSymbol,
    outputSymbol,
    amount,
    amountKind:
      action === "confirm" || action === "cancel" || action === "unknown"
        ? undefined
        : (parsed.amountKind ??
          (action === "buy" && inputSymbol === "USDC" && amount !== "max" ? "usd" : "token")),
    recipient: parsed.recipient ?? undefined,
    confidence: parsed.confidence ?? fallbackConfidence,
    requiresConfirmation: action !== "confirm" && action !== "cancel",
  };
}

function extractJsonObject(payload: string) {
  const fencedMatch = payload.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const jsonMatch = payload.match(/\{[\s\S]*\}/);
  return jsonMatch?.[0];
}

function buildVoicePrompt(transcript: string) {
  const tokenCatalog = FEATURED_TOKENS.map((token) => `${token.symbol} (${token.name})`).join(", ");

  return [
    "Parse the user's spoken trading request into JSON only.",
    "Supported actions: swap, buy, sell, send, stake, confirm, cancel, unknown.",
    `Supported tokens: ${tokenCatalog}.`,
    'Use this exact JSON shape: {"action":"swap|buy|sell|send|stake|confirm|cancel|unknown","inputSymbol":"TOKEN or null","outputSymbol":"TOKEN or null","amount":"string or null","amountKind":"token|usd|null","recipient":"string or null","confidence":0.0}',
    'Rules: normalize token symbols to uppercase tickers, map "ethereum" and "ether" to ETH, map "usd" and "usd coin" to USDC.',
    'If the user says "all", "max", "maximum", "full balance", or "entire balance", return amount as "max".',
    'Map short approval phrases like "confirm", "yes confirm", "go ahead", "execute", and "submit trade" to action "confirm".',
    'Map stop phrases like "cancel", "stop", "abort", "never mind", and "do not trade" to action "cancel".',
    'If the user says "buy TOKEN" without a funding token, assume USDC as input and set amountKind to "usd".',
    'If the user says "sell TOKEN" without an output token, assume USDC as output.',
    "If anything important is missing or unclear, return action unknown with the best available fields.",
    `Transcript: ${transcript}`,
  ].join("\n");
}

function parseVoiceIntentFallback(transcript: string): VoiceIntent {
  const normalized = transcript.trim().replace(/\s+/g, " ");
  const lower = canonicalizeTranscript(normalized);

  if (
    /^(confirm|yes|yes confirm|confirm swap|go ahead|execute|submit|submit trade|do it|proceed)$/i.test(
      lower,
    )
  ) {
    return {
      action: "confirm",
      confidence: 0.97,
      requiresConfirmation: false,
    };
  }

  if (
    /^(cancel|stop|abort|never mind|nevermind|do not trade|don't trade|don t trade)$/i.test(lower)
  ) {
    return {
      action: "cancel",
      confidence: 0.97,
      requiresConfirmation: false,
    };
  }

  const swapPattern = new RegExp(
    `swap\\s+(\\$?[\\d.]+|all|max|maximum|full balance|entire balance|whole balance)\\s+(?:of\\s+)?(${TOKEN_NAME_PATTERN.source})(?:\\s+(?:to|for|into|with)\\s+(${TOKEN_NAME_PATTERN.source}))?$`,
  );
  const swapMatch = lower.match(swapPattern);

  if (swapMatch) {
    const [, amount, source, target] = swapMatch;
    const inputSymbol = normalizeSymbol(source);
    const outputSymbol = normalizeSymbol(target);

    return {
      action: "swap",
      inputSymbol,
      outputSymbol: outputSymbol && SYMBOL_TO_ADDRESS[outputSymbol] ? outputSymbol : outputSymbol,
      amount: normalizeAmount(amount),
      amountKind: "token",
      confidence: 0.86,
      requiresConfirmation: true,
    };
  }

  const buyPattern = new RegExp(
    `buy\\s+(\\$?[\\d.]+|all|max|maximum|full balance|entire balance|whole balance)\\s+(?:of\\s+)?(${TOKEN_NAME_PATTERN.source})(?:\\s+(?:with|using|from)\\s+(${TOKEN_NAME_PATTERN.source}))?$`,
  );
  const buyMatch = lower.match(buyPattern);
  if (buyMatch) {
    const [, amount, target, source] = buyMatch;
    const inputSymbol = normalizeSymbol(source) ?? "USDC";
    return {
      action: "buy",
      inputSymbol,
      outputSymbol: normalizeSymbol(target),
      amount: normalizeAmount(amount),
      amountKind: inputSymbol === "USDC" && normalizeAmount(amount) !== "max" ? "usd" : "token",
      confidence: 0.84,
      requiresConfirmation: true,
    };
  }

  const buyTargetOnlyPattern = new RegExp(`buy\\s+(${TOKEN_NAME_PATTERN.source})$`);
  const buyTargetOnlyMatch = lower.match(buyTargetOnlyPattern);
  if (buyTargetOnlyMatch) {
    return {
      action: "buy",
      inputSymbol: "USDC",
      outputSymbol: normalizeSymbol(buyTargetOnlyMatch[1]),
      confidence: 0.76,
      requiresConfirmation: true,
      amountKind: "usd",
    };
  }

  const sellPattern = new RegExp(
    `sell\\s+(\\$?[\\d.]+|all|max|maximum|full balance|entire balance|whole balance)\\s+(?:of\\s+)?(${TOKEN_NAME_PATTERN.source})(?:\\s+(?:to|for|into|with)\\s+(${TOKEN_NAME_PATTERN.source}))?$`,
  );
  const sellMatch = lower.match(sellPattern);
  if (sellMatch) {
    const [, amount, source, target] = sellMatch;
    return {
      action: "sell",
      inputSymbol: normalizeSymbol(source),
      outputSymbol: normalizeSymbol(target) ?? "USDC",
      amount: normalizeAmount(amount),
      amountKind: "token",
      confidence: 0.84,
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

export async function parseVoiceIntent(transcript: string): Promise<VoiceIntent> {
  const normalizedTranscript = transcript.trim().replace(/\s+/g, " ");
  if (!normalizedTranscript) {
    return parseVoiceIntentFallback(transcript);
  }

  if (!NVIDIA_API_KEY) {
    return parseVoiceIntentFallback(normalizedTranscript);
  }

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL_NAME,
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 240,
        messages: [
          {
            role: "system",
            content:
              "You are a trading intent parser for a voice-driven swap terminal. Respond with JSON only.",
          },
          {
            role: "user",
            content: buildVoicePrompt(normalizedTranscript),
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("NVIDIA API returned an empty completion.");
    }

    const jsonString = extractJsonObject(content);
    if (!jsonString) {
      throw new Error("No JSON object found in NVIDIA response.");
    }

    const parsed = llmIntentSchema.parse(JSON.parse(jsonString));
    return normalizeVoiceIntent(parsed, 0.93);
  } catch {
    return parseVoiceIntentFallback(normalizedTranscript);
  }
}
