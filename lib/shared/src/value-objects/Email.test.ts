import { describe, it, expect } from "vitest";
import { Email } from "./Email";

describe(Email, () => {
  it("creates normalized email and exposes value", () => {
    const e = Email.create("  Foo@Example.COM ");
    expect(e.getValue()).toBe("foo@example.com");
  });

  it("validates email format", () => {
    expect(Email.isValid("a@b.co")).toBe(true);
    expect(Email.isValid("invalid-email")).toBe(false);
  });

  it("equals compares by value", () => {
    const a = Email.create("a@b.co");
    const b = Email.create("A@B.CO");
    expect(a.equals(b)).toBe(true);
  });

  it("rejects emails with control characters for safety", () => {
    expect(Email.isValid('"user\x01"@example.com')).toBe(false);
    expect(Email.isValid("user\x01@example.com")).toBe(false);
  });
});
