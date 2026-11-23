import { describe, expect, it } from "vitest";
import { cookieAttributes, endOfEventDay, signCookie, verifyCookie } from "@/lib/signed-cookie";

const secret = "a".repeat(32);
const now = new Date("2026-11-22T08:00:00Z").getTime();
const hour = 3_600_000;

describe("signed cookie value", () => {
  it("round-trips a payload before it expires", () => {
    const value = signCookie({ station: "counter", id: "abc" }, { secret, expiresAt: now + hour });
    expect(verifyCookie(value, { secret, now })).toEqual({ station: "counter", id: "abc" });
  });

  it("rejects a tampered payload", () => {
    const value = signCookie({ station: "counter", id: "abc" }, { secret, expiresAt: now + hour });
    const [, sig] = value.split(".");
    const forged = `${Buffer.from(JSON.stringify({ station: "counter", id: "other", exp: now + hour })).toString("base64url")}.${sig}`;
    expect(verifyCookie(forged, { secret, now })).toBeNull();
    expect(verifyCookie(value + "x", { secret, now })).toBeNull();
  });

  it("rejects a value signed with another secret", () => {
    const value = signCookie({ id: "abc" }, { secret: "b".repeat(32), expiresAt: now + hour });
    expect(verifyCookie(value, { secret, now })).toBeNull();
  });

  it("rejects an expired value", () => {
    const value = signCookie({ id: "abc" }, { secret, expiresAt: now + hour });
    expect(verifyCookie(value, { secret, now: now + hour + 1 })).toBeNull();
  });

  it("rejects garbage and missing values", () => {
    for (const junk of ["", "nodot", "a.b.c", "....", undefined]) expect(verifyCookie(junk, { secret, now })).toBeNull();
  });

  it("refuses to sign with a short secret", () => {
    expect(() => signCookie({ id: "abc" }, { secret: "short", expiresAt: now + hour })).toThrow();
  });
});

describe("cookie attributes and event-day expiry", () => {
  it("sets HttpOnly, Secure, SameSite=Lax and the expiry", () => {
    const expires = new Date(now + hour);
    expect(cookieAttributes(expires)).toEqual({ httpOnly: true, secure: true, sameSite: "lax", path: "/", expires });
  });

  it("expires at the end of the event day (local midnight, WIB by default)", () => {
    // 08:00 UTC on 22 Nov is 15:00 WIB; the day ends at 24:00 WIB = 17:00 UTC.
    expect(new Date(endOfEventDay(now)).toISOString()).toBe("2026-11-22T17:00:00.000Z");
    // 18:00 UTC is already 01:00 WIB on 23 Nov; that day ends 23 Nov 17:00 UTC.
    const late = new Date("2026-11-22T18:00:00Z").getTime();
    expect(new Date(endOfEventDay(late)).toISOString()).toBe("2026-11-23T17:00:00.000Z");
  });
});
