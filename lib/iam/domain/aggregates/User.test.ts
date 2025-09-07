import { describe, it, expect } from "vitest";
import { User } from "./User";

describe(User, () => {
  it("should create a user with valid data", () => {
    const userData = {
      id: "user-123",
      email: "john@example.com",
      hashedPassword: "hashed-password",
    };

    const user = User.create(userData);

    expect(user.data.id).toBe("user-123");
    expect(user.data.email).toBe("john@example.com");
    expect(user.data.hashedPassword).toBe("hashed-password");
    expect(user.data.createdAt).toBeInstanceOf(Date);
  });

  it("should create user from existing data", () => {
    const createdAt = new Date("2025-01-01");
    const userData = {
      id: "user-123",
      email: "john@example.com",
      hashedPassword: "hashed-password",
      createdAt,
    };

    const user = User.fromData(userData);

    expect(user.data.id).toBe("user-123");
    expect(user.data.email).toBe("john@example.com");
    expect(user.data.hashedPassword).toBe("hashed-password");
    expect(user.data.createdAt).toBe(createdAt);
  });

  it("should have immutable data", () => {
    const user = User.create({
      id: "user-123",
      email: "john@example.com",
      hashedPassword: "hashed-password",
    });

    expect(() => {
      user.data.email = "changed@example.com";
    }).toThrow();
  });
});
