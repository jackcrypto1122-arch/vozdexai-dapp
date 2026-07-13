import { NextResponse } from "next/server";
import { getWalletBalances } from "@/lib/server/robinhood";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet is required." }, { status: 400 });
  }

  try {
    const balances = await getWalletBalances(wallet);
    return NextResponse.json({ wallet, balances });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load balances.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
