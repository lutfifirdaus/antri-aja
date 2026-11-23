import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPrisma } from "@/lib/db";
import { getParticipantView } from "@/lib/participant-view";
import type { TicketStatus } from "@/generated/prisma/enums";
import { GET } from "@/app/api/t/[token]/route";

const db = getPrisma();

async function seed() {
  const event = await db.event.create({ data: { slug: `e-${crypto.randomUUID()}`, name: "Distribusi Qurban" } });
  const counterA = await db.counter.create({ data: { eventId: event.id, code: "A", name: "Loket A" } });
  const counterB = await db.counter.create({ data: { eventId: event.id, code: "B", name: "Loket B" } });
  const person = (name: string) =>
    db.participant.create({
      data: { eventId: event.id, name, phone: "081234", token: crypto.randomUUID(), source: "self" },
    });
  const ticket = (participantId: string, counterId: string, number: number, status: TicketStatus = "waiting") =>
    db.ticket.create({ data: { eventId: event.id, participantId, counterId, number, queueOrder: number, status } });
  return { counterA, counterB, person, ticket };
}

const ctx = (token: string) => ({ params: Promise.resolve({ token }) });

describe("getParticipantView", () => {
  beforeEach(async () => {
    await db.event.deleteMany();
  });
  afterAll(async () => {
    await db.event.deleteMany();
    await db.$disconnect();
  });

  it("returns null for an unknown or oversized token", async () => {
    expect(await getParticipantView(db, "nope")).toBeNull();
    expect(await getParticipantView(db, "x".repeat(500))).toBeNull();
  });

  it("shows name and no ticket before check-in, and never the phone", async () => {
    const { person } = await seed();
    const p = await person("Siti");
    const view = await getParticipantView(db, p.token);
    expect(view).toEqual({ eventName: "Distribusi Qurban", participantName: "Siti", ticket: null });
    expect(JSON.stringify(view)).not.toContain("081234");
  });

  it("counts only waiting tickets earlier in the same counter's line", async () => {
    const { counterA, counterB, person, ticket } = await seed();
    const [p1, p2, p3, p4, me] = await Promise.all(["1", "2", "3", "4", "me"].map(person));
    await ticket(p1.id, counterA.id, 1, "served");
    await ticket(p2.id, counterA.id, 2);
    await ticket(p3.id, counterB.id, 3);
    await ticket(p4.id, counterA.id, 4);
    await ticket(me.id, counterA.id, 5);
    const view = await getParticipantView(db, me.token);
    expect(view?.ticket).toMatchObject({ number: "A5", status: "waiting", ahead: 2, counter: { name: "Loket A" } });
  });

  it("reports no ahead count once called, and keeps the previous number of a moved ticket", async () => {
    const { counterB, person, ticket } = await seed();
    const me = await person("me");
    const t = await ticket(me.id, counterB.id, 7, "called");
    await db.ticket.update({ where: { id: t.id }, data: { previousNumber: "A12" } });
    const view = await getParticipantView(db, me.token);
    expect(view?.ticket).toMatchObject({ number: "B7", status: "called", ahead: null, previousNumber: "A12" });
  });
});

describe("GET /api/t/:token", () => {
  it("returns 404 for an unknown token and 200 uncached for a known one", async () => {
    const { person } = await seed();
    const p = await person("Budi");
    const missing = await GET(new Request("http://x"), ctx("nope"));
    expect(missing.status).toBe(404);
    const found = await GET(new Request("http://x"), ctx(p.token));
    expect(found.status).toBe(200);
    expect(found.headers.get("cache-control")).toBe("no-store");
    expect((await found.json()).participantName).toBe("Budi");
  });
});
