import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin-allowlist";

describe("isAdminEmail", () => {
  const allowlist = "ani@example.test, Budi@Example.test";

  it("accepts a listed email", () => {
    expect(isAdminEmail("ani@example.test", allowlist)).toBe(true);
  });

  it("ignores case and surrounding spaces", () => {
    expect(isAdminEmail("  BUDI@example.TEST ", allowlist)).toBe(true);
  });

  it("refuses an unlisted email", () => {
    expect(isAdminEmail("eve@example.test", allowlist)).toBe(false);
  });

  it("refuses everyone when the allowlist is empty or unset", () => {
    expect(isAdminEmail("ani@example.test", "")).toBe(false);
    expect(isAdminEmail("ani@example.test", undefined)).toBe(false);
  });

  it("refuses a missing email", () => {
    expect(isAdminEmail(null, allowlist)).toBe(false);
    expect(isAdminEmail("", allowlist)).toBe(false);
  });

  it("does not match on a substring of a listed email", () => {
    expect(isAdminEmail("ani@example.test.evil", allowlist)).toBe(false);
    expect(isAdminEmail("xani@example.test", allowlist)).toBe(false);
  });
});
