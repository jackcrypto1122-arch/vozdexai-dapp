"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useSignTypedData,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { ArrowRight, Info, RefreshCw } from "lucide-react";
import { LuxCard } from "@/components/ui/lux-card";
import { TokenIcon } from "@/components/ui/token-icon";
import { TokenSelectField } from "@/components/token/token-select-field";
import { useMarkets, useQuote, useWalletBalances } from "@/hooks/use-oraculum-data";
import { useTokenOptions } from "@/hooks/use-token-options";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PERMIT2_ADDRESS, ROBINHOOD_CHAIN_ID } from "@/lib/constants";
import { useOraculumStore } from "@/store/oraculum-store";

type TokenChoice = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balanceUi?: number;
  balanceRaw?: string;
  priceUsd?: number | null;
  logoUri?: string;
};

export function SwapCard() {
  const { address: walletAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync, isPending } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();
  const [hash, setHash] = useState<`0x${string}`>();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const swapInputAddress = useOraculumStore((state) => state.swapInputAddress);
  const swapOutputAddress = useOraculumStore((state) => state.swapOutputAddress);
  const swapAmount = useOraculumStore((state) => state.swapAmount);
  const slippageBps = useOraculumStore((state) => state.slippageBps);
  const setSwapPair = useOraculumStore((state) => state.setSwapPair);
  const setSwapAmount = useOraculumStore((state) => state.setSwapAmount);
  const upsertExecution = useOraculumStore((state) => state.upsertExecution);

  const { data: balances } = useWalletBalances(walletAddress);
  const { data: marketPayload } = useMarkets();
  const markets = useMemo(() => marketPayload?.markets ?? [], [marketPayload?.markets]);
  const tokenOptions = useTokenOptions();

  const tokens = useMemo<TokenChoice[]>(() => {
    const byAddress = new Map<string, TokenChoice>();

    for (const token of tokenOptions) {
      const market = markets.find(
        (row) => row.address.toLowerCase() === token.address.toLowerCase(),
      );
      byAddress.set(token.address.toLowerCase(), {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        priceUsd: market?.priceUsd ?? null,
        logoUri: token.logoUri,
      });
    }

    for (const balance of balances ?? []) {
      const previous = byAddress.get(balance.address.toLowerCase());
      byAddress.set(balance.address.toLowerCase(), {
        address: balance.address,
        symbol: balance.symbol,
        name: balance.name,
        decimals: balance.decimals,
        balanceUi: balance.amountUi,
        balanceRaw: balance.amountRaw,
        priceUsd: balance.usdPrice,
        ...previous,
      });
    }

    return Array.from(byAddress.values());
  }, [balances, markets, tokenOptions]);

  const inputToken =
    tokens.find((token) => token.address.toLowerCase() === swapInputAddress.toLowerCase()) ??
    tokens[0];
  const outputToken =
    tokens.find((token) => token.address.toLowerCase() === swapOutputAddress.toLowerCase()) ??
    tokens[1] ??
    tokens[0];

  // ── Enforce: one side must always be ETH/WETH ──
  const isEthLike = (addr: string) =>
    addr.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ||
    addr.toLowerCase() === "0x0bd7d308f8e1639fab988df18a8011f41eacad73";

  const inputIsEth = isEthLike(swapInputAddress);
  const outputIsEth = isEthLike(swapOutputAddress);

  // If user somehow picked non-ETH on BOTH sides, auto-fix the output to ETH
  useEffect(() => {
    if (!inputIsEth && !outputIsEth) {
      setSwapPair(swapInputAddress, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    }
  }, [inputIsEth, outputIsEth, swapInputAddress, setSwapPair]);

  // Filter tokens for each dropdown: the OTHER side must be ETH
  const inputTokenOptions = tokenOptions; // user can pick anything on input side
  const outputTokenOptions = useMemo(() => {
    if (inputIsEth) {
      // Input is ETH → output shows only non-ETH tokens
      return tokenOptions.filter((t) => !isEthLike(t.address));
    }
    // Input is a token → output locked to ETH only
    return tokenOptions.filter((t) => isEthLike(t.address));
  }, [tokenOptions, inputIsEth]);

  const amountNumber = Number.parseFloat(swapAmount || "0");
  const quoteRequest =
    isConnected &&
    inputToken &&
    outputToken &&
    amountNumber > 0 &&
    inputToken.address !== outputToken.address
      ? {
          inputAddress: inputToken.address,
          outputAddress: outputToken.address,
          amountRaw: parseUnits(swapAmount, inputToken.decimals).toString(),
          slippageBps,
          walletAddress: walletAddress!,
        }
      : null;

  const {
    data: quote,
    error: quoteError,
    isLoading: quoteLoading,
    refetch,
  } = useQuote(quoteRequest);

  const receiveAmount =
    quote && outputToken
      ? formatAmount(
          Number.parseFloat(formatUnits(BigInt(quote.outAmountRaw), outputToken.decimals)),
          6,
        )
      : "0";
  const rate =
    quote && inputToken && outputToken && amountNumber > 0
      ? Number.parseFloat(formatUnits(BigInt(quote.outAmountRaw), outputToken.decimals)) /
        amountNumber
      : null;

  useEffect(() => {
    if (hash) {
      upsertExecution({
        hash,
        status: "submitted",
        explorerUrl: `https://explorer.chain.robinhood.com/tx/${hash}`,
        createdAt: new Date().toISOString(),
        inputSymbol: inputToken?.symbol,
        outputSymbol: outputToken?.symbol,
        inAmountUi: amountNumber,
        outAmountUi: quote
          ? Number.parseFloat(formatUnits(BigInt(quote.outAmountRaw), outputToken.decimals))
          : undefined,
      });
    }
  }, [
    hash,
    inputToken?.symbol,
    outputToken?.symbol,
    amountNumber,
    quote,
    outputToken?.decimals,
    upsertExecution,
  ]);

  useEffect(() => {
    if (receipt && hash) {
      upsertExecution({
        hash,
        status: receipt.status === "success" ? "confirmed" : "failed",
        explorerUrl: `https://explorer.chain.robinhood.com/tx/${hash}`,
        createdAt: new Date().toISOString(),
        inputSymbol: inputToken?.symbol,
        outputSymbol: outputToken?.symbol,
        inAmountUi: amountNumber,
        outAmountUi: quote
          ? Number.parseFloat(formatUnits(BigInt(quote.outAmountRaw), outputToken.decimals))
          : undefined,
      });
    }
  }, [
    receipt,
    hash,
    inputToken?.symbol,
    outputToken?.symbol,
    amountNumber,
    quote,
    outputToken?.decimals,
    upsertExecution,
  ]);

  const flip = () => {
    if (!inputToken || !outputToken) {
      return;
    }
    setSwapPair(outputToken.address, inputToken.address);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isConnected || !walletAddress || !inputToken || !outputToken || !quoteRequest || !quote) {
      setError("Connect a wallet and enter a valid amount to request a live quote.");
      return;
    }
    if (!publicClient) {
      setError("Robinhood Chain client is unavailable.");
      return;
    }

    type SwapPayload = {
      error?: string;
      to?: string;
      data?: string;
      value?: string;
      gas?: string;
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

    let permit2Permit:
      | {
          amount: string;
          expiration: number;
          nonce: number;
          sigDeadline: string;
          signature: string;
        }
      | undefined;

    const requestSwap = async () => {
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quoteRequest, permit2Permit }),
      });
      const payload = (await response.json()) as SwapPayload;
      if (!response.ok || !payload.to || !payload.data) {
        throw new Error(payload.error ?? "Unable to build swap.");
      }
      return payload;
    };

    try {
      setError(null);
      setHash(undefined);
      setIsSubmitting(true);

      const completedApprovals = new Set<string>();

      for (let step = 0; step < 10; step += 1) {
        const payload = await requestSwap();

        if (payload.approvalNeeded) {
          const approval = payload.approvalNeeded;
          const approvalKey =
            `${approval.kind}:${approval.token}:${approval.spender}`.toLowerCase();

          // The browser wallet and the server can briefly read different RPC heads after an
          // approval is mined. Do not ask the user to approve the same allowance twice; wait
          // for the server RPC to observe the receipt and rebuild the final swap instead.
          if (completedApprovals.has(approvalKey)) {
            await new Promise((resolve) => setTimeout(resolve, 1_500));
            continue;
          }

          const approvalTarget = approval.token as `0x${string}`;
          const approvalData = encodeFunctionData({
            abi: [
              {
                inputs: [
                  { name: "spender", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                name: "approve",
                outputs: [{ name: "", type: "bool" }],
                stateMutability: "nonpayable",
                type: "function",
              },
            ] as const,
            functionName: "approve",
            args: [approval.spender as `0x${string}`, 2n ** 256n - 1n],
          });
          const approvalHash = await sendTransactionAsync({
            to: approvalTarget,
            data: approvalData,
          });
          const approvalReceipt = await publicClient.waitForTransactionReceipt({
            hash: approvalHash,
          });
          if (approvalReceipt.status !== "success") {
            throw new Error("Token approval failed on Robinhood Chain.");
          }
          completedApprovals.add(approvalKey);
          await new Promise((resolve) => setTimeout(resolve, 1_000));
          continue;
        }

        if (payload.permit2SignatureNeeded) {
          const permit = payload.permit2SignatureNeeded;
          const signature = await signTypedDataAsync({
            domain: {
              name: "Permit2",
              chainId: ROBINHOOD_CHAIN_ID,
              verifyingContract: PERMIT2_ADDRESS as `0x${string}`,
            },
            types: {
              PermitDetails: [
                { name: "token", type: "address" },
                { name: "amount", type: "uint160" },
                { name: "expiration", type: "uint48" },
                { name: "nonce", type: "uint48" },
              ],
              PermitSingle: [
                { name: "details", type: "PermitDetails" },
                { name: "spender", type: "address" },
                { name: "sigDeadline", type: "uint256" },
              ],
            },
            primaryType: "PermitSingle",
            message: {
              details: {
                token: permit.token as `0x${string}`,
                amount: BigInt(permit.amount),
                expiration: permit.expiration,
                nonce: permit.nonce,
              },
              spender: permit.spender as `0x${string}`,
              sigDeadline: BigInt(permit.sigDeadline),
            },
          });
          permit2Permit = { ...permit, signature };
          continue;
        }
        const swapHash = await sendTransactionAsync({
          to: payload.to as `0x${string}`,
          data: payload.data as `0x${string}`,
          value: payload.value ? BigInt(payload.value) : undefined,
          gas: payload.gas ? BigInt(payload.gas) : undefined,
        });
        setHash(swapHash);
        return;
      }

      throw new Error(
        "Approvals succeeded, but the Robinhood RPC did not expose them in time. Try Swap again.",
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Swap submission failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const networkFeeDisplay = quote?.estimatedGas
    ? `${formatAmount(Number(formatUnits(BigInt(quote.estimatedGas), 9)), 6)} ETH`
    : "~ dynamic";

  return (
    <LuxCard className="overflow-visible">
      {/* ── token panels ── */}
      <div className="grid gap-px bg-border/60 md:grid-cols-2">
        <TokenLeg
          label="You pay"
          tokens={inputTokenOptions}
          token={inputToken}
          amount={swapAmount}
          onAmount={setSwapAmount}
          onTokenChange={(address) => {
            // If user picks a non-ETH input, force output to ETH
            if (!isEthLike(address)) {
              setSwapPair(address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
            } else {
              setSwapPair(address, swapOutputAddress);
            }
          }}
          selectedAddress={swapInputAddress}
          excludeAddress={swapOutputAddress}
          max
          onMax={() =>
            setSwapAmount(
              inputToken?.balanceRaw != null
                ? formatUnits(BigInt(inputToken.balanceRaw), inputToken.decimals)
                : swapAmount,
            )
          }
        />
        <TokenLeg
          label="You receive"
          tokens={outputTokenOptions}
          token={outputToken}
          amount={receiveAmount}
          onTokenChange={(address) => {
            // If user picks a non-ETH output, force input to ETH
            if (!isEthLike(address)) {
              setSwapPair("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", address);
            } else {
              setSwapPair(swapInputAddress, address);
            }
          }}
          selectedAddress={swapOutputAddress}
          excludeAddress={swapInputAddress}
          readOnly
        />
      </div>

      {/* ── flip button ── */}
      <div className="relative">
        <div className="absolute left-1/2 -top-5 -translate-x-1/2 z-10 md:-top-5">
          <motion.button
            type="button"
            onClick={flip}
            whileHover={{ rotate: 180 }}
            transition={{ type: "spring", stiffness: 250, damping: 18 }}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-primary/30 bg-card shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] transition-colors hover:border-primary/60"
            aria-label="Swap direction"
          >
            <span className="flex items-center gap-0.5 text-primary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 16l-4-4 4-4" />
                <path d="M17 8l4 4-4 4" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
            </span>
          </motion.button>
        </div>
      </div>

      {/* ── info bar ── */}
      <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60 bg-background/40">
        <InfoCell
          label="Rate"
          value={
            rate != null && inputToken && outputToken
              ? `1 ${inputToken.symbol} = ${formatAmount(rate, 3)} ${outputToken.symbol}`
              : "—"
          }
          icon={
            quoteLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <button
                type="button"
                onClick={() => void refetch()}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Refresh quote"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )
          }
        />
        <InfoCell
          label="Slippage tolerance"
          value={`${(slippageBps / 100).toFixed(2)}%`}
          icon={
            <span className="text-muted-foreground">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
          }
        />
        <InfoCell
          label="Est. network fee"
          value={networkFeeDisplay}
          icon={<Info className="h-3.5 w-3.5 text-muted-foreground" />}
        />
      </div>

      {/* ── error / not-connected banner ── */}
      {(error || quoteError || !isConnected) && (
        <div className="border-t border-border/60 px-6 py-3 text-center text-sm text-muted-foreground">
          {error ??
            (quoteError instanceof Error ? quoteError.message : null) ??
            "Connect a wallet to trade."}
        </div>
      )}

      {/* ── submit button ── */}
      <div className="px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !quote || isPending || isSubmitting || isConfirming || quoteLoading || !isConnected
          }
          className={cn(
            "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-xs uppercase tracking-[0.28em] text-black",
            "bg-primary",
            "shadow-[0_20px_50px_-15px_rgba(200,255,0,0.35)] transition-shadow hover:shadow-[0_25px_60px_-15px_rgba(200,255,0,0.45)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-full"
          />
          <span className="relative">
            {isPending || isSubmitting
              ? "Submitting swap"
              : isConfirming
                ? "Confirming swap"
                : isConnected
                  ? "Review and sign swap"
                  : "Connect wallet to trade"}
          </span>
          <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </LuxCard>
  );
}

/* ═══════════════════════════════════════════
   Token Leg — icon selector + big amount
   ═══════════════════════════════════════════ */

function TokenLeg({
  label,
  tokens,
  token,
  amount,
  onAmount,
  onTokenChange,
  selectedAddress,
  excludeAddress,
  max,
  onMax,
  readOnly,
}: {
  label: string;
  tokens: TokenChoice[];
  token?: TokenChoice;
  amount: string;
  onAmount?: (value: string) => void;
  onTokenChange: (address: string) => void;
  selectedAddress: string;
  excludeAddress?: string;
  max?: boolean;
  onMax?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="relative bg-card px-4 py-3 sm:px-5 sm:py-4">
      {/* header row: label + balance */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {label}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Balance{" "}
          <span className="tabular-nums text-foreground/80">
            {formatAmount(token?.balanceUi ?? 0, 4)} {token?.symbol ?? ""}
          </span>
        </span>
      </div>

      {/* token icon + selector */}
      <div className="mt-2.5 flex items-center gap-2.5">
        <TokenIcon symbol={token?.symbol} logoUri={token?.logoUri} size="md" />
        <div className="min-w-0 flex-1">
          <TokenSelectField
            label={label}
            value={selectedAddress}
            tokens={tokens}
            excludeAddress={excludeAddress}
            onChange={onTokenChange}
            showLabel={false}
            className="space-y-2"
          />
        </div>
      </div>

      {/* amount input */}
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          {max && (
            <button
              type="button"
              onClick={onMax}
              className="rounded-md border-2 border-border/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:border-primary/50 hover:text-primary"
            >
              Max
            </button>
          )}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          readOnly={readOnly}
          onChange={(event) => onAmount?.(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-right font-sans text-2xl tabular-nums text-foreground outline-none placeholder:text-muted-foreground/50 sm:text-3xl"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Info Cell — single stat in bottom bar
   ═══════════════════════════════════════════ */

function InfoCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-xs tabular-nums text-foreground/90">{value}</p>
      </div>
      {icon && <div className="shrink-0">{icon}</div>}
    </div>
  );
}
