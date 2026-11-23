import { createHmac, timingSafeEqual } from "node:crypto";

const MIN_SECRET_LENGTH = 32;
const DAY_MS = 86_400_000;
// Event timezone offset: WIB (UTC+7), which has no daylight saving.
const DEFAULT_UTC_OFFSET_MINUTES = 7 * 60;

type SignOptions = { secret: string; expiresAt: number };
type VerifyOptions = { secret: string; now?: number };

function mac(body: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(body).digest();
}

/** `base64url(json).base64url(hmac)`. The expiry is inside the signed payload, so it cannot be extended. */
export function signCookie(payload: Record<string, unknown>, { secret, expiresAt }: SignOptions): string {
  if (secret.length < MIN_SECRET_LENGTH) throw new Error("cookie secret must be at least 32 characters");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: expiresAt })).toString("base64url");
  return `${body}.${mac(body, secret).toString("base64url")}`;
}

export function verifyCookie(
  value: string | null | undefined,
  { secret, now = Date.now() }: VerifyOptions,
): Record<string, unknown> | null {
  if (!value || secret.length < MIN_SECRET_LENGTH) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const given = Buffer.from(signature, "base64url");
  const expected = mac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { exp, ...payload } = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof exp !== "number" || exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookieAttributes(expires: Date) {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", expires };
}

/** Next local midnight, as epoch ms. */
export function endOfEventDay(now: number, utcOffsetMinutes = DEFAULT_UTC_OFFSET_MINUTES): number {
  const offset = utcOffsetMinutes * 60_000;
  return Math.floor((now + offset) / DAY_MS) * DAY_MS + DAY_MS - offset;
}
