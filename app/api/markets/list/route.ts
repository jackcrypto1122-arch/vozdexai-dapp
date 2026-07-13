import { NextResponse } from "next/server";
import { FEATURED_TOKENS } from "@/lib/constants";
import { getMarketRows, getNetworkSnapshot } from "@/lib/server/robinhood";

export async function GET() {
  try {
    const [markets, network] = await Promise.all([
      getMarketRows(FEATURED_TOKENS.map((token) => token.address)),
      getNetworkSnapshot(),
    ]);

    return NextResponse.json({ markets, network });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load market data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
