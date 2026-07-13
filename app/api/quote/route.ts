import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { getQuote } from "@/lib/server/robinhood";

const quoteSchema = z.object({
  inputAddress: z
    .string()
    .refine((value) => isAddress(value), "Input token must be a valid EVM address."),
  outputAddress: z
    .string()
    .refine((value) => isAddress(value), "Output token must be a valid EVM address."),
  amountRaw: z.string().min(1),
  slippageBps: z.number().min(1).max(5000),
  walletAddress: z
    .string()
    .refine((value) => isAddress(value), "Wallet must be a valid EVM address."),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = quoteSchema.parse(json);
    const quote = await getQuote(payload);
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid quote request." },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unable to fetch quote.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
