"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useOraculumStore } from "@/store/oraculum-store";
import { SYMBOL_TO_ADDRESS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { VoiceIntent } from "@/types/dapp";

const examples = [
  "Swap 2 ETH to USDC",
  "Swap 100 USDC to UNI",
  "Buy 25 LINK",
  "Sell 1 ETH for USDC",
  "Stake 10 ETH",
  "Send 0.5 ETH to Alex",
];

export function VoiceButton() {
  const [idx, setIdx] = useState(0);
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const speech = useSpeechRecognition();
  const setLastIntent = useOraculumStore((state) => state.setLastIntent);
  const setSwapPair = useOraculumStore((state) => state.setSwapPair);
  const setSwapAmount = useOraculumStore((state) => state.setSwapAmount);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % examples.length), 3200);
    return () => clearInterval(t);
  }, []);

  const parseIntent = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) {
        return;
      }

      setIsParsing(true);
      try {
        const response = await fetch("/api/voice/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });
        const payload = (await response.json()) as VoiceIntent & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to parse transcript.");
        }

        setIntent(payload);
        setLastIntent(payload);
        if (payload.amount) {
          setSwapAmount(payload.amount);
        }

        const inputAddress = payload.inputSymbol
          ? SYMBOL_TO_ADDRESS[payload.inputSymbol]
          : undefined;
        const outputAddress = payload.outputSymbol
          ? SYMBOL_TO_ADDRESS[payload.outputSymbol]
          : undefined;
        if (inputAddress && outputAddress) {
          setSwapPair(inputAddress, outputAddress);
        }
      } finally {
        setIsParsing(false);
      }
    },
    [setLastIntent, setSwapAmount, setSwapPair],
  );

  useEffect(() => {
    if (!speech.listening && speech.hasFinalTranscript && speech.transcript.trim()) {
      void parseIntent(speech.transcript);
    }
  }, [parseIntent, speech.hasFinalTranscript, speech.listening, speech.transcript]);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative grid place-items-center">
        <span className="pointer-events-none absolute h-40 w-40 rounded-full border border-primary/30 animate-pulse-ring" />
        <span
          className="pointer-events-none absolute h-40 w-40 rounded-full border border-primary/20 animate-pulse-ring"
          style={{ animationDelay: "0.8s" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute h-56 w-56 rounded-full bg-primary/25 blur-3xl"
        />

        <button
          type="button"
          onClick={() => (speech.listening ? speech.stop() : speech.start())}
          aria-label="Tap to speak"
          disabled={!speech.supported}
          className={cn(
            "group relative h-36 w-36 rounded-full transition-transform",
            "bg-[radial-gradient(circle_at_30%_25%,oklch(0.85_0.16_152)_0%,var(--primary)_45%,oklch(0.5_0.14_152)_100%)]",
            "shadow-[0_20px_60px_-10px_var(--primary),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-6px_16px_rgba(0,0,0,0.25)]",
            "hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100",
            speech.listening && "ring-4 ring-primary/30",
          )}
        >
          <span className="absolute inset-2 rounded-full border border-white/20" />
          <Mic className="relative mx-auto h-10 w-10 text-white drop-shadow" strokeWidth={1.6} />
        </button>
      </div>

      <div className="flex h-10 items-center gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "origin-center w-[3px] rounded-full bg-primary/70",
              speech.listening ? "animate-wave" : "opacity-30",
            )}
            style={{
              height: `${8 + ((i * 13) % 24)}px`,
              animationDelay: `${(i % 10) * 60}ms`,
            }}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="font-sans text-xl text-foreground">
          {speech.listening
            ? "Listening..."
            : speech.supported
              ? "Tap to Speak"
              : "Voice Not Supported"}
        </p>
        <div className="mt-1 min-h-10">
          {speech.error ? (
            <p className="text-xs tracking-wide text-destructive">{speech.error}</p>
          ) : speech.transcript ? (
            <div className="space-y-1">
              <p className="text-xs tracking-wide text-muted-foreground">
                &ldquo;{speech.transcript}&rdquo;
              </p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                {isParsing
                  ? "Parsing intent"
                  : intent
                    ? `${intent.action} ${intent.outputSymbol ?? ""}`.trim()
                    : "Ready"}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.p
                key={idx}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-xs tracking-wide text-muted-foreground"
              >
                &ldquo;{examples[idx]}&rdquo;
              </motion.p>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
