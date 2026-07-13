import { createPublicClient, http } from "viem";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_RPC_URL } from "@/lib/constants";

const schema = z.object({
  signature: z.string().startsWith("0x"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { signature } = schema.parse(json);

    const publicClient = createPublicClient({
      transport: http(DEFAULT_RPC_URL),
    });

    const receipt = await publicClient.getTransactionReceipt({
      hash: signature as `0x${string}`,
    });

    const state = receipt.status === "success" ? "confirmed" : "failed";

    return NextResponse.json({
      signature,
      status: state,
      explorerUrl: `https://robinhoodchain.blockscout.com/tx/${signature}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to track transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
