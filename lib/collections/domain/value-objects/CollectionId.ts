import { randomUUID } from "node:crypto";

export class CollectionId {
  private constructor(private readonly value: string) {}

  static create(): CollectionId {
    return new CollectionId(randomUUID());
  }

  static fromString(value: string): CollectionId {
    if (!value || typeof value !== "string") {
      throw new Error("CollectionId must be a non-empty string");
    }

    // Basic UUID format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error("CollectionId must be a valid UUID");
    }

    return new CollectionId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CollectionId): boolean {
    return this.value === other.value;
  }
}
