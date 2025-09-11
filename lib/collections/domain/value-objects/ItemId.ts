import { randomUUID } from "node:crypto";

export class ItemId {
  private constructor(private readonly value: string) {}

  static create(): ItemId {
    return new ItemId(randomUUID());
  }

  static fromString(value: string): ItemId {
    if (!value || typeof value !== "string") {
      throw new Error("ItemId must be a non-empty string");
    }

    // Basic UUID format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error("ItemId must be a valid UUID");
    }

    return new ItemId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ItemId): boolean {
    return this.value === other.value;
  }
}
