import { isAdminEmail } from "@/lib/admin-allowlist";

type SessionLike = { user?: { email?: string | null } } | null | undefined;

export type AdminCheck = { ok: true; email: string } | { ok: false; status: 401 | 403 };

/** Server-side gate for every admin route: 401 without a session, 403 if the email is not allowlisted. */
export function requireAdmin(session: SessionLike, allowlist?: string): AdminCheck {
  const email = session?.user?.email;
  if (!email) return { ok: false, status: 401 };
  if (!isAdminEmail(email, allowlist ?? process.env.ADMIN_EMAILS)) return { ok: false, status: 403 };
  return { ok: true, email };
}
