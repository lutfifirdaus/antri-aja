import type { PrismaClient } from "@/generated/prisma/client";
import { verifyPin } from "@/lib/pin";

export type Station = { kind: "counter"; id: string } | { kind: "gate"; eventId: string };

export type PinResult = { ok: true } | { ok: false; reason: "wrong" | "locked"; retryAfterSec?: number };

export type PinVerifierDeps = {
  prisma: PrismaClient;
  now?: () => number;
};

export const LIMITS = {
  windowMs: 15 * 60_000,
  maxFailuresPerIpAndStation: 5,
  // Stops a guess spread over many IPs: 30 per 15 min caps a 6-digit PIN at ~2,900 guesses a day.
  maxFailuresPerStation: 30,
};

function stationKey(station: Station): string {
  return station.kind === "counter" ? `counter:${station.id}` : `gate:${station.eventId}`;
}

export function createPinVerifier({ prisma, now = Date.now }: PinVerifierDeps) {
  async function storedHash(station: Station): Promise<string | null> {
    if (station.kind === "counter") {
      return (await prisma.counter.findUnique({ where: { id: station.id } }))?.pinHash ?? null;
    }
    return (await prisma.event.findUnique({ where: { id: station.eventId } }))?.gatePinHash ?? null;
  }

  async function verifyStationPin(input: { station: Station; pin: string; ip: string }): Promise<PinResult> {
    const key = stationKey(input.station);
    const since = new Date(now() - LIMITS.windowMs);

    const recent = await prisma.pinAttempt.findMany({
      where: { stationKey: key, ip: input.ip, createdAt: { gt: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const stationWide = await prisma.pinAttempt.findMany({
      where: { stationKey: key, createdAt: { gt: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const unlockTimes: number[] = [];
    if (recent.length >= LIMITS.maxFailuresPerIpAndStation) {
      unlockTimes.push(recent[recent.length - LIMITS.maxFailuresPerIpAndStation].createdAt.getTime() + LIMITS.windowMs);
    }
    if (stationWide.length >= LIMITS.maxFailuresPerStation) {
      unlockTimes.push(stationWide[stationWide.length - LIMITS.maxFailuresPerStation].createdAt.getTime() + LIMITS.windowMs);
    }
    if (unlockTimes.length) {
      const unlockAt = Math.max(...unlockTimes);
      return { ok: false, reason: "locked", retryAfterSec: Math.max(1, Math.ceil((unlockAt - now()) / 1000)) };
    }

    const ok = await verifyPin(input.pin, await storedHash(input.station));
    if (ok) {
      await prisma.pinAttempt.deleteMany({ where: { stationKey: key, ip: input.ip } });
      return { ok: true };
    }
    await prisma.pinAttempt.create({ data: { stationKey: key, ip: input.ip, createdAt: new Date(now()) } });
    return { ok: false, reason: "wrong" };
  }

  return { verifyStationPin };
}
