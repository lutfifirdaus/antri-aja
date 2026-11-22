import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPrisma } from "@/lib/db";

const db = getPrisma();

async function seed() {
  const event = await db.event.create({ data: { slug: `e-${crypto.randomUUID()}`, name: "Test" } });
  const counterA = await db.counter.create({ data: { eventId: event.id, code: "A", name: "Desk A" } });
  const counterB = await db.counter.create({ data: { eventId: event.id, code: "B", name: "Desk B" } });
  const mk = (name: string) =>
    db.participant.create({
      data: { eventId: event.id, name, token: crypto.randomUUID(), source: "self" },
    });
  const mkTicket = (participantId: string, counterId: string, number: number, queueOrder: number) =>
    db.ticket.create({
      data: { eventId: event.id, participantId, counterId, number, queueOrder },
    });
  return { counterA, counterB, p1: await mk("One"), p2: await mk("Two"), mkTicket };
}

describe("schema constraints", () => {
  beforeEach(async () => {
    await db.event.deleteMany(); // cascades to everything
  });
  afterAll(async () => {
    await db.event.deleteMany();
    await db.$disconnect();
  });

  it("rejects a second ticket for the same participant (exactly-once check-in)", async () => {
    const { counterA, counterB, p1, mkTicket } = await seed();
    await mkTicket(p1.id, counterA.id, 1, 1);
    await expect(mkTicket(p1.id, counterB.id, 1, 1)).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects a duplicate number at the same counter", async () => {
    const { counterA, p1, p2, mkTicket } = await seed();
    await mkTicket(p1.id, counterA.id, 1, 1);
    await expect(mkTicket(p2.id, counterA.id, 1, 2)).rejects.toMatchObject({ code: "P2002" });
  });

  it("allows the same number at different counters and keeps previousNumber nullable", async () => {
    const { counterA, counterB, p1, p2, mkTicket } = await seed();
    const first = await mkTicket(p1.id, counterA.id, 1, 1);
    const second = await mkTicket(p2.id, counterB.id, 1, 1);
    expect(first.previousNumber).toBeNull();
    expect(second.status).toBe("waiting");
  });
});
