import { NextResponse } from "next/server";
import { getMarketRows, getNetworkSnapshot } from "@/lib/server/robinhood";

export async function GET() {
  try {
    const [markets, network] = await Promise.all([getMarketRows(), getNetworkSnapshot()]);

    return NextResponse.json({ markets, network });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load market data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
