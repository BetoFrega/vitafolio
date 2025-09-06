import { describe, it, expect } from "vitest";
import { Role } from "./Role";

describe(Role, () => {
  it("should create a role instance", () => {
    const role = Role.create("admin");
    expect(role.getValue()).toBe("admin");
  });

  it("should throw error for invalid role", () => {
    expect(() => Role.create("invalid")).toThrow("Invalid role");
  });

  it("should validate role values", () => {
    expect(Role.isValid("admin")).toBe(true);
    expect(Role.isValid("member")).toBe(true);
    expect(Role.isValid("invalid")).toBe(false);
  });
});
