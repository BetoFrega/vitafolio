import { NotificationId } from "../value-objects/NotificationId";
import { ItemId } from "../value-objects/ItemId";
import { NotificationType } from "../value-objects/NotificationType";
import { NotificationStatus } from "../value-objects/NotificationStatus";

export type NotificationMetadata = Record<
  string,
  string | number | boolean | Date
>;

export class Notification {
  private constructor(
    public readonly data: {
      id: NotificationId;
      userId: string; // UserId from IAM domain
      itemId: ItemId;
      type: NotificationType;
      message: string;
      scheduledFor: Date;
      deliveredAt?: Date;
      status: NotificationStatus;
      metadata: NotificationMetadata; // Additional notification-specific data
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    Object.freeze(this.data);
  }

  static create(data: {
    userId: string;
    itemId: ItemId;
    type: NotificationType;
    message: string;
    scheduledFor: Date;
    metadata?: NotificationMetadata;
  }): Notification {
    this.validateCreationData(data);

    return new Notification({
      id: NotificationId.create(),
      userId: data.userId,
      itemId: data.itemId,
      type: data.type,
      message: data.message,
      scheduledFor: data.scheduledFor,
      status: NotificationStatus.pending(),
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromData(data: {
    id: NotificationId;
    userId: string;
    itemId: ItemId;
    type: NotificationType;
    message: string;
    scheduledFor: Date;
    deliveredAt?: Date;
    status: NotificationStatus;
    metadata: NotificationMetadata;
    createdAt: Date;
    updatedAt: Date;
  }): Notification {
    return new Notification(data);
  }

  private static validateCreationData(data: {
    userId: string;
    itemId: ItemId;
    type: NotificationType;
    message: string;
    scheduledFor: Date;
    metadata?: NotificationMetadata;
  }): void {
    if (!data.userId || data.userId.trim().length === 0) {
      throw new Error("Notification userId is required");
    }

    if (!data.itemId) {
      throw new Error("Notification itemId is required");
    }

    if (!data.type) {
      throw new Error("Notification type is required");
    }

    if (!data.message || data.message.trim().length === 0) {
      throw new Error("Notification message is required");
    }

    if (data.message.length > 500) {
      throw new Error("Notification message must be 500 characters or less");
    }

    if (!data.scheduledFor) {
      throw new Error("Notification scheduledFor is required");
    }

    if (data.scheduledFor <= new Date()) {
      throw new Error("Notification scheduled date must be in the future");
    }
  }

  markAsDelivered(): Notification {
    if (!this.data.status.canTransitionTo(NotificationStatus.delivered())) {
      throw new Error(
        `Cannot transition from ${this.data.status.getValue()} to delivered`,
      );
    }

    return new Notification({
      ...this.data,
      status: NotificationStatus.delivered(),
      deliveredAt: new Date(),
      updatedAt: new Date(),
    });
  }

  markAsFailed(): Notification {
    if (!this.data.status.canTransitionTo(NotificationStatus.failed())) {
      throw new Error(
        `Cannot transition from ${this.data.status.getValue()} to failed`,
      );
    }

    return new Notification({
      ...this.data,
      status: NotificationStatus.failed(),
      updatedAt: new Date(),
    });
  }

  updateMessage(newMessage: string): Notification {
    if (!newMessage || newMessage.trim().length === 0) {
      throw new Error("Notification message is required");
    }

    if (newMessage.length > 500) {
      throw new Error("Notification message must be 500 characters or less");
    }

    return new Notification({
      ...this.data,
      message: newMessage,
      updatedAt: new Date(),
    });
  }

  reschedule(newDate: Date): Notification {
    if (!newDate) {
      throw new Error("Notification scheduledFor is required");
    }

    if (newDate <= new Date()) {
      throw new Error("Notification scheduled date must be in the future");
    }

    if (this.data.status.getValue() !== "pending") {
      throw new Error("Can only reschedule pending notifications");
    }

    return new Notification({
      ...this.data,
      scheduledFor: newDate,
      updatedAt: new Date(),
    });
  }

  getId(): NotificationId {
    return this.data.id;
  }

  getUserId(): string {
    return this.data.userId;
  }

  getItemId(): ItemId {
    return this.data.itemId;
  }

  getType(): NotificationType {
    return this.data.type;
  }

  getMessage(): string {
    return this.data.message;
  }

  getScheduledFor(): Date {
    return this.data.scheduledFor;
  }

  getDeliveredAt(): Date | undefined {
    return this.data.deliveredAt;
  }

  getStatus(): NotificationStatus {
    return this.data.status;
  }

  getMetadata(): NotificationMetadata {
    return { ...this.data.metadata };
  }

  belongsToUser(userId: string): boolean {
    return this.data.userId === userId;
  }

  isPending(): boolean {
    return this.data.status.getValue() === "pending";
  }

  isDelivered(): boolean {
    return this.data.status.getValue() === "delivered";
  }

  isFailed(): boolean {
    return this.data.status.getValue() === "failed";
  }

  isDue(): boolean {
    return this.data.scheduledFor <= new Date() && this.isPending();
  }
}
