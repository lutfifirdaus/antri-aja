import { auth } from "@/auth";
import { requireAdmin } from "@/lib/require-admin";

export type AdminPageAccess =
  | { state: "admin"; email: string }
  | { state: "anonymous" }
  | { state: "denied"; email: string };

/** Every admin page calls this on the server before reading any data. */
export async function getAdminAccess(): Promise<AdminPageAccess> {
  const session = await auth();
  const check = requireAdmin(session);
  if (check.ok) return { state: "admin", email: check.email };
  if (check.status === 403) return { state: "denied", email: session?.user?.email ?? "" };
  return { state: "anonymous" };
}
