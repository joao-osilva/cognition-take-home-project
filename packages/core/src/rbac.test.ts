import { describe, expect, it } from "vitest";

import { hasRole, requireRole, type Actor } from "./rbac";

const actor = (roles: Actor["roles"]): Actor => ({ id: "u1", roles });

describe("hasRole", () => {
  it("grants a directly-held role", () => {
    expect(hasRole(actor(["kyc:operator"]), "kyc:operator")).toBe(true);
  });

  it("approver implies operator within the same app", () => {
    expect(hasRole(actor(["refunds:approver"]), "refunds:operator")).toBe(true);
  });

  it("does not leak across apps", () => {
    expect(hasRole(actor(["kyc:approver"]), "refunds:operator")).toBe(false);
  });

  it("admin has every role", () => {
    expect(hasRole(actor(["admin"]), "flags:approver")).toBe(true);
  });

  it("requireRole throws for missing role", () => {
    expect(() => requireRole(actor(["kyc:operator"]), "kyc:approver")).toThrow();
  });
});
