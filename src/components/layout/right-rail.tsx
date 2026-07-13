import { WalletCard } from "@/components/wallet/wallet-card";
import { MarketCard } from "@/components/market/market-card";
import { ActivityCard } from "@/components/activity/activity-card";

export function RightRail() {
  return (
    <div className="h-full overflow-y-auto p-5 space-y-4">
      <WalletCard />
      <MarketCard />
      <ActivityCard />
    </div>
  );
}
