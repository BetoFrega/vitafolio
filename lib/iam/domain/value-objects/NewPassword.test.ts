import { NewPassword } from "./NewPassword";

describe("Password Value Object", () => {
  it("should create a Password instance with valid input", () => {
    const password = NewPassword.create("strongpassword");
    expect(password).toBeInstanceOf(NewPassword);
    expect(password.getValue()).toBe("strongpassword");
  });

  it("should throw an error for passwords that are too short", () => {
    expect(() => NewPassword.create("short")).toThrow(
      "Password must be at least 8 characters long",
    );
  });
});
