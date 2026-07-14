import { NextResponse } from "next/server";
import { z } from "zod";
import { parseVoiceIntent } from "@/lib/server/voice";

const schema = z.object({
  transcript: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { transcript } = schema.parse(json);
    const intent = await parseVoiceIntent(transcript);
    return NextResponse.json(intent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse transcript.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
