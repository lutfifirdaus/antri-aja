import { describe, expect, it, afterAll } from "vitest";
import { checkDatabase } from "@/lib/health";
import { createPrismaClient, getPrisma } from "@/lib/db";
import { GET } from "@/app/api/health/route";

describe("checkDatabase", () => {
  it("is true when the database answers", async () => {
    expect(await checkDatabase(getPrisma())).toBe(true);
  });

  it("is false when the database is unreachable", async () => {
    // Port 1 on localhost: nothing listens, connection is refused.
    const dead = createPrismaClient("postgresql://u:p@127.0.0.1:1/none");
    try {
      expect(await checkDatabase(dead, 1500)).toBe(false);
    } finally {
      await dead.$disconnect();
    }
  });
});

describe("GET /api/health", () => {
  afterAll(async () => {
    await getPrisma().$disconnect();
  });

  it("returns 200 with db up when the database answers", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", db: "up" });
  });
});
