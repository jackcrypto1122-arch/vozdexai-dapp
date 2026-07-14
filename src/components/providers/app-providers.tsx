"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { useState, useMemo } from "react";
import { Toaster } from "sonner";
import { DEFAULT_EXPLORER, DEFAULT_RPC_URL, ROBINHOOD_CHAIN_ID } from "@/lib/constants";
import { defineChain } from "viem";

const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [DEFAULT_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: DEFAULT_EXPLORER,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "Vozdex AI",
        projectId: "YOUR_PROJECT_ID", // We can use a dummy for now, or check if there's one in env!
        chains: [robinhoodChain],
        transports: {
          [robinhoodChain.id]: http(),
        },
      }),
    [],
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#C2FF00",
            accentColorForeground: "black",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
          <Toaster position="top-right" richColors />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
