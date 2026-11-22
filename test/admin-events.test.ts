import { afterEach, describe, expect, it } from "vitest";
import { getPrisma } from "@/lib/db";
import { createAdminHandlers } from "@/lib/admin-api";

const prisma = getPrisma();
const admin = { user: { email: "ani@example.test" } };

function handlers(session: unknown = admin) {
  return createAdminHandlers({
    getSession: async () => session as never,
    prisma,
    allowlist: "ani@example.test",
  });
}

function post(body: unknown) {
  return new Request("http://test.local/api/admin/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  await prisma.event.deleteMany({ where: { slug: { startsWith: "t-" } } });
});

describe("POST /api/admin/events", () => {
  it("lets a listed admin create an event", async () => {
    const res = await handlers().createEvent(
      post({ name: "Qurban 2026", slug: "t-qurban", maxParticipants: 500, registrationOpen: true }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      slug: "t-qurban",
      name: "Qurban 2026",
      maxParticipants: 500,
      registrationOpen: true,
    });
    expect(await prisma.event.count({ where: { slug: "t-qurban" } })).toBe(1);
  });

  it("refuses an unlisted Google account on a direct call and creates nothing", async () => {
    const res = await handlers({ user: { email: "eve@example.test" } }).createEvent(
      post({ name: "Sneaky", slug: "t-sneaky" }),
    );
    expect(res.status).toBe(403);
    expect(await prisma.event.count({ where: { slug: "t-sneaky" } })).toBe(0);
  });

  it("answers 401 when nobody is signed in", async () => {
    const res = await handlers(null).createEvent(post({ name: "Anon", slug: "t-anon" }));
    expect(res.status).toBe(401);
    expect(await prisma.event.count({ where: { slug: "t-anon" } })).toBe(0);
  });

  it("rejects invalid input with 400 and creates nothing", async () => {
    const bad = [
      { name: "", slug: "t-empty-name" },
      { name: "X", slug: "T Bad Slug" },
      { name: "X", slug: "t-neg-cap", maxParticipants: -5 },
      { name: "X", slug: "t-zero-cap", maxParticipants: 0 },
      { name: "X", slug: "t-float-cap", maxParticipants: 1.5 },
    ];
    for (const body of bad) {
      expect((await handlers().createEvent(post(body))).status, JSON.stringify(body)).toBe(400);
    }
    expect(await prisma.event.count({ where: { slug: { startsWith: "t-" } } })).toBe(0);
  });

  it("answers 409 for a slug that already exists", async () => {
    await handlers().createEvent(post({ name: "One", slug: "t-dup" }));
    const res = await handlers().createEvent(post({ name: "Two", slug: "t-dup" }));
    expect(res.status).toBe(409);
  });

  it("answers 400 for a body that is not JSON", async () => {
    const res = await handlers().createEvent(
      new Request("http://test.local/api/admin/events", { method: "POST", body: "nope" }),
    );
    expect(res.status).toBe(400);
  });
});
