import { randomUUID } from "node:crypto";

export class NotificationId {
  private constructor(private readonly value: string) {}

  static create(): NotificationId {
    return new NotificationId(randomUUID());
  }

  static fromString(value: string): NotificationId {
    if (!value || typeof value !== "string") {
      throw new Error("NotificationId must be a non-empty string");
    }

    // Basic UUID format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error("NotificationId must be a valid UUID");
    }

    return new NotificationId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: NotificationId): boolean {
    return this.value === other.value;
  }
}
