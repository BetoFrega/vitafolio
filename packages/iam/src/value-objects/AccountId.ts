import { randomUUID } from "crypto";

export class AccountId {
  private constructor(private readonly value: string) {}

  static create(value: string): AccountId {
    if (!AccountId.isValid(value)) {
      throw new Error("Invalid UUID format");
    }
    return new AccountId(value);
  }

  static generate(): AccountId {
    return new AccountId(randomUUID());
  }

  static isValid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccountId): boolean {
    return this.value === other.value;
  }
}
