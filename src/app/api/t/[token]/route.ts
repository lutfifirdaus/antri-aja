import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getParticipantView } from "@/lib/participant-view";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

// Polled by /t/<token> about every 5 s (ADR 0003). The token is the only credential.
export async function GET(_request: Request, ctx: RouteContext<"/api/t/[token]">) {
  const { token } = await ctx.params;
  try {
    const view = await getParticipantView(getPrisma(), token);
    if (!view) return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
    return NextResponse.json(view, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: noStore });
  }
}
