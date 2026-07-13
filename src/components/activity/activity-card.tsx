"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Coins, Layers } from "lucide-react";
import { LuxCard, LuxCardHeader } from "@/components/ui/lux-card";
import { useHistory } from "@/hooks/use-oraculum-data";
import { formatTime, shortAddress } from "@/lib/format";
import { useOraculumStore } from "@/store/oraculum-store";

const icons = {
  swap: ArrowLeftRight,
  receive: ArrowDownLeft,
  send: ArrowUpRight,
  stake: Layers,
  unknown: Coins,
} as const;

export function ActivityCard() {
  const { address } = useAccount();
  const walletAddress = address;
  const { data } = useHistory(walletAddress);
  const executions = useOraculumStore((state) => state.executions);

  const items = useMemo(() => {
    const fromHistory = (data ?? []).map((item) => ({
      id: item.hash,
      kind: item.kind,
      label: item.label,
      time: formatTime(item.timestamp),
    }));

    const fromExecutions = executions.map((item) => ({
      id: item.hash,
      kind: "swap" as const,
      label: `${item.inputSymbol ?? "Token"} → ${item.outputSymbol ?? "Token"}`,
      time: new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(item.createdAt)),
    }));

    return [...fromExecutions, ...fromHistory].slice(0, 6);
  }, [data, executions]);

  return (
    <LuxCard>
      <LuxCardHeader eyebrow="Recent" title="Activity" />
      <ul className="max-h-64 overflow-y-auto px-2 pb-3 pt-2">
        {items.length ? (
          items.map((item) => {
            const Icon = icons[item.kind] ?? Coins;
            return (
              <li
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-background/60"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/60 bg-background/50">
                  <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.6} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs text-foreground">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {item.kind}
                  </span>
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">{item.time}</span>
              </li>
            );
          })
        ) : (
          <li className="px-3 py-4 text-xs text-muted-foreground">
            {walletAddress
              ? "No recent wallet activity yet."
              : `Connect a wallet to stream activity instead of ${shortAddress(walletAddress)}.`}
          </li>
        )}
      </ul>
    </LuxCard>
  );
}
