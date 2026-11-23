import { randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

const PIN_LENGTH = 6;
// @node-rs/argon2 defaults to argon2id (Algorithm.Argon2id = 2).
const ARGON2ID = 2;

/** Random numeric PIN, uniformly drawn from a CSPRNG. */
export function generatePin(): string {
  return String(randomInt(0, 10 ** PIN_LENGTH)).padStart(PIN_LENGTH, "0");
}

export function hashPin(pin: string): Promise<string> {
  return hash(pin, { algorithm: ARGON2ID });
}

export async function verifyPin(pin: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash) return false;
  try {
    return await verify(storedHash, pin);
  } catch {
    return false;
  }
}
