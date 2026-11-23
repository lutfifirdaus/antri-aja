import type { PrismaClient } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { generatePin, hashPin } from "@/lib/pin";

type Session = { user?: { email?: string | null } } | null;

export type AdminDeps = {
  getSession: () => Promise<Session>;
  prisma: PrismaClient;
  allowlist?: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type EventInput = { name: string; slug: string; maxParticipants: number | null; registrationOpen: boolean };

function parseEventInput(body: unknown): EventInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { name, slug, maxParticipants, registrationOpen } = body as Record<string, unknown>;
  if (typeof name !== "string" || !name.trim()) return null;
  if (typeof slug !== "string" || !SLUG.test(slug)) return null;
  if (maxParticipants != null && !(Number.isInteger(maxParticipants) && (maxParticipants as number) > 0)) return null;
  if (registrationOpen != null && typeof registrationOpen !== "boolean") return null;
  return {
    name: name.trim(),
    slug,
    maxParticipants: (maxParticipants as number | null | undefined) ?? null,
    registrationOpen: registrationOpen ?? false,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COUNTER_CODE = /^[A-Za-z0-9]{1,8}$/;
const COUNTER_STATUSES = ["open", "paused", "closed"] as const;
type CounterStatus = (typeof COUNTER_STATUSES)[number];

type CounterInput = { eventId: string; code: string; name: string; status: CounterStatus };

// Partial update: only keys present are validated and applied.
function parseEventPatch(body: unknown): Partial<EventInput> | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const out: Partial<EventInput> = {};
  if ("name" in b) {
    if (typeof b.name !== "string" || !b.name.trim()) return null;
    out.name = b.name.trim();
  }
  if ("slug" in b) {
    if (typeof b.slug !== "string" || !SLUG.test(b.slug)) return null;
    out.slug = b.slug;
  }
  if ("maxParticipants" in b) {
    const v = b.maxParticipants;
    if (v !== null && !(Number.isInteger(v) && (v as number) > 0)) return null;
    out.maxParticipants = v as number | null;
  }
  if ("registrationOpen" in b) {
    if (typeof b.registrationOpen !== "boolean") return null;
    out.registrationOpen = b.registrationOpen;
  }
  return out;
}

function parseCounterPatch(body: unknown): Partial<Pick<CounterInput, "name" | "status">> | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const out: Partial<Pick<CounterInput, "name" | "status">> = {};
  if ("name" in b) {
    if (typeof b.name !== "string" || !b.name.trim()) return null;
    out.name = b.name.trim();
  }
  if ("status" in b) {
    if (!COUNTER_STATUSES.includes(b.status as CounterStatus)) return null;
    out.status = b.status as CounterStatus;
  }
  return out;
}

function parseCounterInput(body: unknown): CounterInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { eventId, code, name, status } = body as Record<string, unknown>;
  if (typeof eventId !== "string" || !UUID.test(eventId)) return null;
  if (typeof code !== "string" || !COUNTER_CODE.test(code)) return null;
  if (typeof name !== "string" || !name.trim()) return null;
  if (status != null && !COUNTER_STATUSES.includes(status as CounterStatus)) return null;
  return { eventId, code, name: name.trim(), status: (status as CounterStatus | undefined) ?? "open" };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function prismaCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null ? (error as { code?: string }).code : undefined;
}

const isUniqueViolation = (error: unknown) => prismaCode(error) === "P2002";
const isNotFound = (error: unknown) => prismaCode(error) === "P2025";
const isMissingRelation = (error: unknown) => prismaCode(error) === "P2003";

// PIN hashes never leave the server: strip them from every response.
function publicEvent<T extends { gatePinHash?: unknown }>(event: T): Omit<T, "gatePinHash"> {
  const copy = { ...event };
  delete copy.gatePinHash;
  return copy;
}

function publicCounter<T extends { pinHash?: unknown }>(counter: T): Omit<T, "pinHash"> {
  const copy = { ...counter };
  delete copy.pinHash;
  return copy;
}

export function createAdminHandlers({ getSession, prisma, allowlist }: AdminDeps) {
  async function guard(): Promise<Response | null> {
    const check = requireAdmin(await getSession(), allowlist);
    return check.ok ? null : Response.json({ error: "forbidden" }, { status: check.status });
  }

  async function createEvent(request: Request): Promise<Response> {
    const denied = await guard();
    if (denied) return denied;
    const input = parseEventInput(await readJson(request));
    if (!input) return Response.json({ error: "invalid" }, { status: 400 });
    try {
      const event = await prisma.event.create({ data: input });
      return Response.json(publicEvent(event), { status: 201 });
    } catch (error) {
      if (isUniqueViolation(error)) return Response.json({ error: "slug taken" }, { status: 409 });
      throw error;
    }
  }

  async function createCounter(request: Request): Promise<Response> {
    const denied = await guard();
    if (denied) return denied;
    const input = parseCounterInput(await readJson(request));
    if (!input) return Response.json({ error: "invalid" }, { status: 400 });
    try {
      const counter = await prisma.counter.create({ data: input });
      return Response.json(publicCounter(counter), { status: 201 });
    } catch (error) {
      if (isUniqueViolation(error)) return Response.json({ error: "code taken" }, { status: 409 });
      if (isMissingRelation(error)) return Response.json({ error: "event not found" }, { status: 404 });
      throw error;
    }
  }

  async function updateEvent(request: Request, id: string): Promise<Response> {
    const denied = await guard();
    if (denied) return denied;
    const data = parseEventPatch(await readJson(request));
    if (!data || !UUID.test(id)) return Response.json({ error: "invalid" }, { status: UUID.test(id) ? 400 : 404 });
    try {
      return Response.json(publicEvent(await prisma.event.update({ where: { id }, data })));
    } catch (error) {
      if (isNotFound(error)) return Response.json({ error: "not found" }, { status: 404 });
      if (isUniqueViolation(error)) return Response.json({ error: "slug taken" }, { status: 409 });
      throw error;
    }
  }

  async function updateCounter(request: Request, id: string): Promise<Response> {
    const denied = await guard();
    if (denied) return denied;
    const data = parseCounterPatch(await readJson(request));
    if (!data || !UUID.test(id)) return Response.json({ error: "invalid" }, { status: UUID.test(id) ? 400 : 404 });
    try {
      return Response.json(publicCounter(await prisma.counter.update({ where: { id }, data })));
    } catch (error) {
      if (isNotFound(error)) return Response.json({ error: "not found" }, { status: 404 });
      throw error;
    }
  }

  // The PIN is returned in this response only; just the hash is stored.
  async function issueCounterPin(_request: Request, id: string): Promise<Response> {
    const denied = await guard();
    if (denied) return denied;
    if (!UUID.test(id)) return Response.json({ error: "not found" }, { status: 404 });
    const pin = generatePin();
    try {
      await prisma.counter.update({ where: { id }, data: { pinHash: await hashPin(pin) } });
    } catch (error) {
      if (isNotFound(error)) return Response.json({ error: "not found" }, { status: 404 });
      throw error;
    }
    return Response.json({ pin }, { headers: { "cache-control": "no-store" } });
  }

  async function issueGatePin(_request: Request, eventId: string): Promise<Response> {
    const denied = await guard();
    if (denied) return denied;
    if (!UUID.test(eventId)) return Response.json({ error: "not found" }, { status: 404 });
    const pin = generatePin();
    try {
      await prisma.event.update({ where: { id: eventId }, data: { gatePinHash: await hashPin(pin) } });
    } catch (error) {
      if (isNotFound(error)) return Response.json({ error: "not found" }, { status: 404 });
      throw error;
    }
    return Response.json({ pin }, { headers: { "cache-control": "no-store" } });
  }

  return { createEvent, createCounter, updateEvent, updateCounter, issueCounterPin, issueGatePin };
}
