import { describe, expect, it } from "vitest";
import { requireAdmin } from "@/lib/require-admin";

const allowlist = "ani@example.test";

describe("requireAdmin", () => {
  it("lets a listed session through and returns its email", () => {
    const result = requireAdmin({ user: { email: "ani@example.test" } }, allowlist);
    expect(result).toEqual({ ok: true, email: "ani@example.test" });
  });

  it("answers 401 when there is no session", () => {
    expect(requireAdmin(null, allowlist)).toEqual({ ok: false, status: 401 });
    expect(requireAdmin({}, allowlist)).toEqual({ ok: false, status: 401 });
  });

  it("answers 403 for a signed-in account that is not on the allowlist", () => {
    expect(requireAdmin({ user: { email: "eve@example.test" } }, allowlist)).toEqual({ ok: false, status: 403 });
  });

  it("re-checks the allowlist each call, so removing an email revokes access", () => {
    const session = { user: { email: "ani@example.test" } };
    expect(requireAdmin(session, allowlist).ok).toBe(true);
    expect(requireAdmin(session, "").ok).toBe(false);
  });
});
