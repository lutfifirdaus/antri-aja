import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPrisma } from "@/lib/db";
import { createAdminHandlers } from "@/lib/admin-api";

const prisma = getPrisma();
const admin = { user: { email: "ani@example.test" } };

function handlers(session: unknown = admin) {
  return createAdminHandlers({ getSession: async () => session as never, prisma, allowlist: "ani@example.test" });
}

function post(path: string, body: unknown) {
  return new Request(`http://test.local${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

let eventId: string;

beforeEach(async () => {
  const res = await handlers().createEvent(post("/api/admin/events", { name: "Event", slug: "t-counters" }));
  eventId = (await res.json()).id;
});

afterEach(async () => {
  await prisma.event.deleteMany({ where: { slug: { startsWith: "t-" } } });
});

describe("POST /api/admin/counters", () => {
  it("lets a listed admin add two counters to an event", async () => {
    const a = await handlers().createCounter(post("/api/admin/counters", { eventId, code: "A", name: "Loket A" }));
    const b = await handlers().createCounter(
      post("/api/admin/counters", { eventId, code: "B", name: "Loket B", status: "paused" }),
    );
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(await a.json()).toMatchObject({ code: "A", name: "Loket A", status: "open" });
    expect(await b.json()).toMatchObject({ code: "B", status: "paused" });
    expect(await prisma.counter.count({ where: { eventId } })).toBe(2);
  });

  it("refuses an unlisted account and creates nothing (guard is shared; regression test)", async () => {
    const res = await handlers({ user: { email: "eve@example.test" } }).createCounter(
      post("/api/admin/counters", { eventId, code: "A", name: "Loket A" }),
    );
    expect(res.status).toBe(403);
    expect(await prisma.counter.count({ where: { eventId } })).toBe(0);
  });

  it("rejects invalid input with 400", async () => {
    const bad = [
      { eventId, code: "", name: "X" },
      { eventId, code: "a b", name: "X" },
      { eventId, code: "A", name: "" },
      { eventId, code: "A", name: "X", status: "broken" },
      { eventId: "not-a-uuid", code: "A", name: "X" },
      { code: "A", name: "X" },
    ];
    for (const body of bad) {
      expect((await handlers().createCounter(post("/api/admin/counters", body))).status, JSON.stringify(body)).toBe(400);
    }
    expect(await prisma.counter.count({ where: { eventId } })).toBe(0);
  });

  it("answers 409 for a code already used in the same event", async () => {
    await handlers().createCounter(post("/api/admin/counters", { eventId, code: "A", name: "One" }));
    const res = await handlers().createCounter(post("/api/admin/counters", { eventId, code: "A", name: "Two" }));
    expect(res.status).toBe(409);
  });

  it("answers 404 for an event that does not exist", async () => {
    const res = await handlers().createCounter(
      post("/api/admin/counters", { eventId: "00000000-0000-4000-8000-000000000000", code: "A", name: "X" }),
    );
    expect(res.status).toBe(404);
  });
});

function patch(path: string, body: unknown) {
  return new Request(`http://test.local${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/events/:id and /api/admin/counters/:id", () => {
  it("edits only the fields sent, on an event", async () => {
    const res = await handlers().updateEvent(
      patch(`/api/admin/events/${eventId}`, { name: "Renamed", registrationOpen: true, maxParticipants: 300 }),
      eventId,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ slug: "t-counters", name: "Renamed", registrationOpen: true, maxParticipants: 300 });
    const cleared = await handlers().updateEvent(patch(`/api/admin/events/${eventId}`, { maxParticipants: null }), eventId);
    expect(await cleared.json()).toMatchObject({ name: "Renamed", maxParticipants: null });
  });

  it("switches a counter between open, paused and closed", async () => {
    const created = await handlers().createCounter(post("/api/admin/counters", { eventId, code: "A", name: "Loket A" }));
    const { id } = await created.json();
    const res = await handlers().updateCounter(patch(`/api/admin/counters/${id}`, { status: "closed" }), id);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ code: "A", status: "closed" });
    const bad = await handlers().updateCounter(patch(`/api/admin/counters/${id}`, { status: "broken" }), id);
    expect(bad.status).toBe(400);
  });

  it("answers 404 for an unknown id and 403 for an unlisted account", async () => {
    const unknown = "00000000-0000-4000-8000-000000000000";
    expect((await handlers().updateEvent(patch("/x", { name: "N" }), unknown)).status).toBe(404);
    expect((await handlers().updateCounter(patch("/x", { name: "N" }), unknown)).status).toBe(404);
    const eve = handlers({ user: { email: "eve@example.test" } });
    expect((await eve.updateEvent(patch("/x", { name: "N" }), eventId)).status).toBe(403);
    expect((await eve.updateCounter(patch("/x", { name: "N" }), unknown)).status).toBe(403);
  });
});
