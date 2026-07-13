"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ARROW_ADDRESS, ETH_ADDRESS } from "@/lib/constants";
import type { ExecutionStatus, TokenInfo, VoiceIntent } from "@/types/dapp";

type OraculumState = {
  swapInputAddress: string;
  swapOutputAddress: string;
  swapAmount: string;
  slippageBps: number;
  priorityFee: "auto" | "low" | "medium" | "high";
  lastIntent?: VoiceIntent;
  executions: ExecutionStatus[];
  customTokens: TokenInfo[];
  setSwapPair: (inputAddress: string, outputAddress: string) => void;
  setSwapAmount: (amount: string) => void;
  setSlippage: (slippageBps: number) => void;
  setPriorityFee: (priorityFee: OraculumState["priorityFee"]) => void;
  setLastIntent: (intent?: VoiceIntent) => void;
  upsertExecution: (execution: ExecutionStatus) => void;
  upsertCustomToken: (token: TokenInfo) => void;
};

export const useOraculumStore = create<OraculumState>()(
  persist(
    (set) => ({
      swapInputAddress: ETH_ADDRESS,
      swapOutputAddress: ARROW_ADDRESS,
      swapAmount: "1",
      slippageBps: 50,
      priorityFee: "auto",
      executions: [],
      customTokens: [],
      setSwapPair: (swapInputAddress, swapOutputAddress) =>
        set({ swapInputAddress, swapOutputAddress }),
      setSwapAmount: (swapAmount) => set({ swapAmount }),
      setSlippage: (slippageBps) => set({ slippageBps }),
      setPriorityFee: (priorityFee) => set({ priorityFee }),
      setLastIntent: (lastIntent) => set({ lastIntent }),
      upsertExecution: (execution) =>
        set((state) => ({
          executions: [
            execution,
            ...state.executions.filter((entry) => entry.hash !== execution.hash),
          ].slice(0, 20),
        })),
      upsertCustomToken: (token) =>
        set((state) => ({
          customTokens: [
            token,
            ...state.customTokens.filter(
              (entry) => entry.address.toLowerCase() !== token.address.toLowerCase(),
            ),
          ].slice(0, 20),
        })),
    }),
    {
      name: "oraculum-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        swapInputAddress: state.swapInputAddress,
        swapOutputAddress: state.swapOutputAddress,
        swapAmount: state.swapAmount,
        slippageBps: state.slippageBps,
        priorityFee: state.priorityFee,
        executions: state.executions,
        lastIntent: state.lastIntent,
        customTokens: state.customTokens,
      }),
    },
  ),
);
