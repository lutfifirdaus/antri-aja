import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPrisma } from "@/lib/db";
import { createAdminHandlers } from "@/lib/admin-api";
import { verifyPin } from "@/lib/pin";

const prisma = getPrisma();
const admin = { user: { email: "ani@example.test" } };

function handlers(session: unknown = admin) {
  return createAdminHandlers({ getSession: async () => session as never, prisma, allowlist: "ani@example.test" });
}
const req = (method: string, body?: unknown) =>
  new Request("http://test.local/x", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });

let eventId: string;
let counterId: string;

beforeEach(async () => {
  const e = await (await handlers().createEvent(req("POST", { name: "E", slug: "t-pins" }))).json();
  eventId = e.id;
  counterId = (await (await handlers().createCounter(req("POST", { eventId, code: "A", name: "Loket A" }))).json()).id;
});

afterEach(async () => {
  await prisma.event.deleteMany({ where: { slug: { startsWith: "t-" } } });
});

describe("issuing station PINs", () => {
  it("shows a counter PIN once and stores only its hash", async () => {
    const res = await handlers().issueCounterPin(req("POST"), counterId);
    expect(res.status).toBe(200);
    const { pin } = await res.json();
    expect(pin).toMatch(/^\d{6,}$/);

    const row = await prisma.counter.findUniqueOrThrow({ where: { id: counterId } });
    expect(row.pinHash).not.toBeNull();
    expect(row.pinHash).not.toContain(pin);
    expect(await verifyPin(pin, row.pinHash)).toBe(true);
  });

  it("shows the gate PIN once, per event", async () => {
    const { pin } = await (await handlers().issueGatePin(req("POST"), eventId)).json();
    const row = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(await verifyPin(pin, row.gatePinHash)).toBe(true);
  });

  it("rotating replaces the PIN: the old one stops working", async () => {
    const first = (await (await handlers().issueCounterPin(req("POST"), counterId)).json()).pin;
    const second = (await (await handlers().issueCounterPin(req("POST"), counterId)).json()).pin;
    const row = await prisma.counter.findUniqueOrThrow({ where: { id: counterId } });
    expect(await verifyPin(second, row.pinHash)).toBe(true);
    if (first !== second) expect(await verifyPin(first, row.pinHash)).toBe(false);
  });

  it("never returns a PIN hash from create or edit responses", async () => {
    await handlers().issueCounterPin(req("POST"), counterId);
    await handlers().issueGatePin(req("POST"), eventId);
    const counter = await (await handlers().updateCounter(req("PATCH", { name: "Loket A2" }), counterId)).json();
    const event = await (await handlers().updateEvent(req("PATCH", { name: "E2" }), eventId)).json();
    expect(counter).not.toHaveProperty("pinHash");
    expect(event).not.toHaveProperty("gatePinHash");
    expect(JSON.stringify(counter) + JSON.stringify(event)).not.toContain("argon2");
  });

  it("refuses an unlisted account and leaves the PIN unchanged", async () => {
    const eve = handlers({ user: { email: "eve@example.test" } });
    expect((await eve.issueCounterPin(req("POST"), counterId)).status).toBe(403);
    expect((await eve.issueGatePin(req("POST"), eventId)).status).toBe(403);
    const row = await prisma.counter.findUniqueOrThrow({ where: { id: counterId } });
    expect(row.pinHash).toBeNull();
  });

  it("answers 404 for an unknown counter or event", async () => {
    const unknown = "00000000-0000-4000-8000-000000000000";
    expect((await handlers().issueCounterPin(req("POST"), unknown)).status).toBe(404);
    expect((await handlers().issueGatePin(req("POST"), unknown)).status).toBe(404);
  });
});
