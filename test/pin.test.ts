import { describe, expect, it } from "vitest";
import { generatePin, hashPin, verifyPin } from "@/lib/pin";

describe("PIN primitives", () => {
  it("generates a numeric PIN of at least 6 characters", () => {
    for (let i = 0; i < 50; i++) expect(generatePin()).toMatch(/^\d{6,}$/);
  });

  it("generates different PINs (not a constant)", () => {
    const seen = new Set(Array.from({ length: 30 }, () => generatePin()));
    expect(seen.size).toBeGreaterThan(20);
  });

  it("hashes with argon2id and never stores the PIN itself", async () => {
    const hash = await hashPin("123456");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).not.toContain("123456");
  });

  it("verifies the right PIN and rejects a wrong one", async () => {
    const hash = await hashPin("123456");
    expect(await verifyPin("123456", hash)).toBe(true);
    expect(await verifyPin("654321", hash)).toBe(false);
  });

  it("rejects safely when there is no hash or the hash is garbage", async () => {
    expect(await verifyPin("123456", null)).toBe(false);
    expect(await verifyPin("123456", "not-a-hash")).toBe(false);
  });
});
