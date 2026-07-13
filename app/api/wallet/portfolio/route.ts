import { NextResponse } from "next/server";
import { getPortfolioSummary } from "@/lib/server/robinhood";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet is required." }, { status: 400 });
  }

  try {
    const portfolio = await getPortfolioSummary(wallet);
    return NextResponse.json(portfolio);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load portfolio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
