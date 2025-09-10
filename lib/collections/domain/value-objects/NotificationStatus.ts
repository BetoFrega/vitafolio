export type NotificationStatusValue = "pending" | "delivered" | "failed";

export class NotificationStatus {
  private constructor(private readonly value: NotificationStatusValue) {}

  static fromString(value: string): NotificationStatus {
    if (!this.isValidStatus(value)) {
      throw new Error(
        `Invalid notification status: ${value}. Must be one of: pending, delivered, failed`,
      );
    }
    return new NotificationStatus(value as NotificationStatusValue);
  }

  static pending(): NotificationStatus {
    return new NotificationStatus("pending");
  }

  static delivered(): NotificationStatus {
    return new NotificationStatus("delivered");
  }

  static failed(): NotificationStatus {
    return new NotificationStatus("failed");
  }

  private static isValidStatus(
    value: string,
  ): value is NotificationStatusValue {
    return ["pending", "delivered", "failed"].includes(value);
  }

  getValue(): NotificationStatusValue {
    return this.value;
  }

  equals(other: NotificationStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  canTransitionTo(newStatus: NotificationStatus): boolean {
    // State machine validation: pending can go to delivered or failed
    // delivered and failed are terminal states
    if (this.value === "pending") {
      return newStatus.value === "delivered" || newStatus.value === "failed";
    }
    return false;
  }
}
