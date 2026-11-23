import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPrisma } from "@/lib/db";
import { hashPin } from "@/lib/pin";
import { createPinVerifier } from "@/lib/pin-lockout";

const prisma = getPrisma();
const MIN = 60_000;

let counterId: string;
let otherCounterId: string;
let eventId: string;
let clock = new Date("2026-11-22T08:00:00Z").getTime();

const station = () => ({ kind: "counter" as const, id: counterId });
const verifier = () => createPinVerifier({ prisma, now: () => clock });

beforeEach(async () => {
  clock = new Date("2026-11-22T08:00:00Z").getTime();
  const event = await prisma.event.create({ data: { slug: "t-lockout", name: "E" } });
  eventId = event.id;
  counterId = (await prisma.counter.create({ data: { eventId, code: "A", name: "A", pinHash: await hashPin("246810") } })).id;
  otherCounterId = (await prisma.counter.create({ data: { eventId, code: "B", name: "B", pinHash: await hashPin("246810") } })).id;
});

afterEach(async () => {
  await prisma.event.deleteMany({ where: { slug: { startsWith: "t-" } } });
  await prisma.pinAttempt.deleteMany();
});

describe("verifyStationPin", () => {
  it("accepts the right PIN and rejects a wrong one", async () => {
    const v = verifier();
    expect(await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.1" })).toEqual({ ok: true });
    expect(await v.verifyStationPin({ station: station(), pin: "000000", ip: "203.0.113.1" })).toEqual({
      ok: false,
      reason: "wrong",
    });
  });

  it("rejects a station that has no PIN set or does not exist", async () => {
    const v = verifier();
    const noPin = (await prisma.counter.create({ data: { eventId, code: "C", name: "C" } })).id;
    expect((await v.verifyStationPin({ station: { kind: "counter", id: noPin }, pin: "246810", ip: "203.0.113.1" })).ok).toBe(false);
    expect(
      (await v.verifyStationPin({ station: { kind: "counter", id: "00000000-0000-4000-8000-000000000000" }, pin: "246810", ip: "203.0.113.1" })).ok,
    ).toBe(false);
  });
});

describe("lockout after repeated wrong PINs", () => {
  const wrong = (v: ReturnType<typeof verifier>, ip: string, st = station()) =>
    v.verifyStationPin({ station: st, pin: "000000", ip });

  it("locks an IP out of a station after 5 wrong attempts, even for the right PIN", async () => {
    const v = verifier();
    for (let i = 0; i < 5; i++) expect(await wrong(v, "203.0.113.1")).toMatchObject({ ok: false, reason: "wrong" });

    const locked = await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.1" });
    expect(locked).toMatchObject({ ok: false, reason: "locked" });
    expect((locked as { retryAfterSec: number }).retryAfterSec).toBeGreaterThan(0);
  });

  it("does not lock a different IP, or the same IP at a different station", async () => {
    const v = verifier();
    for (let i = 0; i < 5; i++) await wrong(v, "203.0.113.1");
    expect(await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.2" })).toEqual({ ok: true });
    expect(
      await v.verifyStationPin({ station: { kind: "counter", id: otherCounterId }, pin: "246810", ip: "203.0.113.1" }),
    ).toEqual({ ok: true });
  });

  it("does not count 4 wrong attempts as a lockout", async () => {
    const v = verifier();
    for (let i = 0; i < 4; i++) await wrong(v, "203.0.113.1");
    expect(await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.1" })).toEqual({ ok: true });
  });
});

describe("lockout lifecycle", () => {
  const wrong = (v: ReturnType<typeof verifier>, ip: string) =>
    v.verifyStationPin({ station: station(), pin: "000000", ip });

  it("unlocks once the 15-minute window has passed (characterization)", async () => {
    const v = verifier();
    for (let i = 0; i < 5; i++) await wrong(v, "203.0.113.1");
    clock += 14 * MIN;
    expect((await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.1" })).ok).toBe(false);
    clock += 2 * MIN;
    expect(await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.1" })).toEqual({ ok: true });
  });

  it("locks the whole station after 30 wrong attempts from many IPs", async () => {
    const v = verifier();
    for (let i = 0; i < 30; i++) await wrong(v, `198.51.100.${i + 1}`);
    const res = await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.200" });
    expect(res).toMatchObject({ ok: false, reason: "locked" });
    // Another station is unaffected.
    expect(
      await v.verifyStationPin({ station: { kind: "counter", id: otherCounterId }, pin: "246810", ip: "203.0.113.200" }),
    ).toEqual({ ok: true });
  });

  it("a correct PIN clears that IP's earlier typos", async () => {
    const v = verifier();
    for (let i = 0; i < 4; i++) await wrong(v, "203.0.113.1");
    expect(await v.verifyStationPin({ station: station(), pin: "246810", ip: "203.0.113.1" })).toEqual({ ok: true });
    for (let i = 0; i < 4; i++) expect(await wrong(v, "203.0.113.1")).toMatchObject({ reason: "wrong" });
  });

  it("works for the gate PIN too", async () => {
    await prisma.event.update({ where: { id: eventId }, data: { gatePinHash: await hashPin("135790") } });
    const v = verifier();
    const gate = { kind: "gate" as const, eventId };
    expect(await v.verifyStationPin({ station: gate, pin: "135790", ip: "203.0.113.1" })).toEqual({ ok: true });
    for (let i = 0; i < 5; i++) await v.verifyStationPin({ station: gate, pin: "000000", ip: "203.0.113.9" });
    expect(await v.verifyStationPin({ station: gate, pin: "135790", ip: "203.0.113.9" })).toMatchObject({ reason: "locked" });
  });
});
