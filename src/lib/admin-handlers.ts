import { auth } from "@/auth";
import { getPrisma } from "@/lib/db";
import { createAdminHandlers } from "@/lib/admin-api";

/** Admin handlers wired to the real Auth.js session and database. Built per request so imports stay free of env needs. */
export function adminHandlers() {
  return createAdminHandlers({ getSession: () => auth(), prisma: getPrisma() });
}
