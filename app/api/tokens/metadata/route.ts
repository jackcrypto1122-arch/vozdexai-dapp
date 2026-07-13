import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { resolveTokenMetadata } from "@/lib/server/token-metadata";

const querySchema = z.object({
  address: z.string().trim().min(1, "Contract address is required."),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payload = querySchema.parse({
      address: searchParams.get("address") ?? "",
    });

    if (!isAddress(payload.address)) {
      return NextResponse.json({ error: "Enter a valid EVM contract address." }, { status: 400 });
    }

    const metadata = await resolveTokenMetadata(payload.address);
    return NextResponse.json(metadata);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unable to fetch token metadata.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
