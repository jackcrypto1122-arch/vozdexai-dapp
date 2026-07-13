import { create } from "zustand";

type WalletState = {
  connected: boolean;
  address?: string;
  connect: (address: string) => void;
  disconnect: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  connect: (address) => set({ connected: true, address }),
  disconnect: () => set({ connected: false, address: undefined }),
}));

type SwapState = {
  fromSymbol: string;
  toSymbol: string;
  amount: string;
  setPair: (from: string, to: string) => void;
  setAmount: (a: string) => void;
};

export const useSwapStore = create<SwapState>((set) => ({
  fromSymbol: "SOL",
  toSymbol: "USDC",
  amount: "2.00",
  setPair: (fromSymbol, toSymbol) => set({ fromSymbol, toSymbol }),
  setAmount: (amount) => set({ amount }),
}));

type VoiceState = {
  listening: boolean;
  transcript: string;
  setListening: (v: boolean) => void;
  setTranscript: (t: string) => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
  listening: false,
  transcript: "",
  setListening: (listening) => set({ listening }),
  setTranscript: (transcript) => set({ transcript }),
}));

type SettingsState = {
  slippageBps: number;
  priorityFee: "auto" | "low" | "medium" | "high";
  language: string;
  setSlippage: (bps: number) => void;
  setPriorityFee: (p: SettingsState["priorityFee"]) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  slippageBps: 50,
  priorityFee: "auto",
  language: "en",
  setSlippage: (slippageBps) => set({ slippageBps }),
  setPriorityFee: (priorityFee) => set({ priorityFee }),
}));
