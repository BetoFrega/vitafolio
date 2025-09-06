import { Email } from "./Email";

describe(Email, () => {
  it("should create an Email instance", () => {
    const email = Email.create("test@example.com");
    expect(email.getValue()).toBe("test@example.com");
  });

  it("should throw error for invalid email", () => {
    expect(() => Email.create("invalid")).toThrow("Invalid email format");
  });

  it("should validate email format", () => {
    expect(Email.isValid("test@example.com")).toBe(true);
    expect(Email.isValid("invalid")).toBe(false);
  });

  it("should normalize email to lowercase", () => {
    const email = Email.create("Test@Example.COM");
    expect(email.getValue()).toBe("test@example.com");
  });
});
