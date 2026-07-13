import { NextResponse } from "next/server";
import { getWalletHistory } from "@/lib/server/robinhood";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet is required." }, { status: 400 });
  }

  try {
    const history = await getWalletHistory(wallet);
    return NextResponse.json({ wallet, history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
