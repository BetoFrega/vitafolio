import type {
  NotificationRepository,
  NotificationSearchOptions,
} from "../ports/NotificationRepository";
import type { Notification } from "../domain/aggregates/Notification";
import type { NotificationId } from "../domain/value-objects/NotificationId";
import type { ItemId } from "../domain/value-objects/ItemId";

export class InMemoryNotificationRepository implements NotificationRepository {
  private notifications = new Map<string, Notification>();

  async save(notification: Notification): Promise<void> {
    this.notifications.set(notification.getId().getValue(), notification);
  }

  async findById(id: NotificationId): Promise<Notification | null> {
    return this.notifications.get(id.getValue()) || null;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter((notification) =>
      notification.belongsToUser(userId),
    );
  }

  async search(options: NotificationSearchOptions): Promise<Notification[]> {
    let results = Array.from(this.notifications.values());

    // Filter by user
    if (options.userId) {
      results = results.filter((notification) =>
        notification.belongsToUser(options.userId!),
      );
    }

    // Filter by item
    if (options.itemId) {
      results = results.filter((notification) =>
        notification.getItemId().equals(options.itemId!),
      );
    }

    // Filter by type
    if (options.type) {
      results = results.filter((notification) =>
        notification.getType().equals(options.type!),
      );
    }

    // Filter by status
    if (options.status) {
      results = results.filter((notification) =>
        notification.getStatus().equals(options.status!),
      );
    }

    // Filter by scheduled date range
    if (options.scheduledBefore) {
      results = results.filter(
        (notification) =>
          notification.getScheduledFor() <= options.scheduledBefore!,
      );
    }

    if (options.scheduledAfter) {
      results = results.filter(
        (notification) =>
          notification.getScheduledFor() >= options.scheduledAfter!,
      );
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit;

    if (limit) {
      return results.slice(offset, offset + limit);
    }

    return results.slice(offset);
  }

  async findDueNotifications(): Promise<Notification[]> {
    const now = new Date();
    return Array.from(this.notifications.values()).filter(
      (notification) =>
        notification.isDue() && notification.getScheduledFor() <= now,
    );
  }

  async findByItemId(itemId: ItemId): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter((notification) =>
      notification.getItemId().equals(itemId),
    );
  }

  async exists(id: NotificationId): Promise<boolean> {
    return this.notifications.has(id.getValue());
  }

  async delete(id: NotificationId): Promise<void> {
    this.notifications.delete(id.getValue());
  }

  async deleteByItemId(itemId: ItemId): Promise<void> {
    const toDelete = Array.from(this.notifications.values())
      .filter((notification) => notification.getItemId().equals(itemId))
      .map((notification) => notification.getId().getValue());

    for (const id of toDelete) {
      this.notifications.delete(id);
    }
  }

  async findPendingBefore(date: Date): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) =>
        notification.isPending() && notification.getScheduledFor() <= date,
    );
  }

  // Test helper methods
  clear(): void {
    this.notifications.clear();
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }
}
