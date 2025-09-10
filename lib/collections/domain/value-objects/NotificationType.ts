export type NotificationTypeValue =
  | "expiration"
  | "maintenance"
  | "reminder"
  | "custom";

export class NotificationType {
  private constructor(private readonly value: NotificationTypeValue) {}

  static fromString(value: string): NotificationType {
    if (!this.isValidType(value)) {
      throw new Error(
        `Invalid notification type: ${value}. Must be one of: expiration, maintenance, reminder, custom`,
      );
    }
    return new NotificationType(value as NotificationTypeValue);
  }

  static expiration(): NotificationType {
    return new NotificationType("expiration");
  }

  static maintenance(): NotificationType {
    return new NotificationType("maintenance");
  }

  static reminder(): NotificationType {
    return new NotificationType("reminder");
  }

  static custom(): NotificationType {
    return new NotificationType("custom");
  }

  private static isValidType(value: string): value is NotificationTypeValue {
    return ["expiration", "maintenance", "reminder", "custom"].includes(value);
  }

  getValue(): NotificationTypeValue {
    return this.value;
  }

  equals(other: NotificationType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
