import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { checkDatabase } from "@/lib/health";

export const dynamic = "force-dynamic";

// Success only if the database answers. Error details are never returned.
export async function GET() {
  let up: boolean;
  try {
    up = await checkDatabase(getPrisma());
  } catch {
    up = false; // e.g. DATABASE_URL missing
  }
  return up
    ? NextResponse.json({ status: "ok", db: "up" })
    : NextResponse.json({ status: "error", db: "down" }, { status: 503 });
}
