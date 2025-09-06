import { AccountId } from "./AccountId";

describe(AccountId, () => {
  it("should create an AccountId instance", () => {
    const id = AccountId.create("123e4567-e89b-12d3-a456-426614174000");
    expect(id.getValue()).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("should throw error for invalid UUID", () => {
    expect(() => AccountId.create("invalid")).toThrow("Invalid UUID format");
  });

  it("should validate UUID format", () => {
    expect(AccountId.isValid("123e4567-e89b-12d3-a456-426614174000")).toBe(
      true,
    );
    expect(AccountId.isValid("invalid")).toBe(false);
  });

  it("should generate a new AccountId", () => {
    const id = AccountId.generate();
    expect(AccountId.isValid(id.getValue())).toBe(true);
  });
});
