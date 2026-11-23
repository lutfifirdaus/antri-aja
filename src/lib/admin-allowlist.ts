/** True only if `email` is in the comma-separated allowlist (ADMIN_EMAILS). Empty or unset allows nobody. */
export function isAdminEmail(
  email: string | null | undefined,
  allowlist: string | undefined = process.env.ADMIN_EMAILS,
): boolean {
  const candidate = email?.trim().toLowerCase();
  if (!candidate || !allowlist) return false;
  return allowlist
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(candidate);
}
