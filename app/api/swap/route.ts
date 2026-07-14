import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { buildSwap } from "@/lib/server/robinhood";

const swapSchema = z.object({
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
  permit2Permit: z
    .object({
      amount: z.string().regex(/^\d+$/),
      expiration: z.number().int().nonnegative(),
      nonce: z.number().int().nonnegative(),
      sigDeadline: z.string().regex(/^\d+$/),
      signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = swapSchema.parse(json);
    const swap = await buildSwap(payload);
    return NextResponse.json(swap);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid swap request." },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unable to build swap.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
