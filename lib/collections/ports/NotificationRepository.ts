import type { Notification } from "../domain/aggregates/Notification";
import type { NotificationId } from "../domain/value-objects/NotificationId";
import type { ItemId } from "../domain/value-objects/ItemId";
import type { NotificationType } from "../domain/value-objects/NotificationType";
import type { NotificationStatus } from "../domain/value-objects/NotificationStatus";

export interface NotificationSearchOptions {
  userId?: string;
  itemId?: ItemId;
  type?: NotificationType;
  status?: NotificationStatus;
  scheduledBefore?: Date;
  scheduledAfter?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationRepository {
  /**
   * Save a notification to the repository
   */
  save(notification: Notification): Promise<void>;

  /**
   * Find a notification by its ID
   */
  findById(id: NotificationId): Promise<Notification | null>;

  /**
   * Find all notifications belonging to a specific user
   */
  findByUserId(userId: string): Promise<Notification[]>;

  /**
   * Find notifications by various criteria
   */
  search(options: NotificationSearchOptions): Promise<Notification[]>;

  /**
   * Find due notifications (scheduled for now or earlier and still pending)
   */
  findDueNotifications(): Promise<Notification[]>;

  /**
   * Find notifications for a specific item
   */
  findByItemId(itemId: ItemId): Promise<Notification[]>;

  /**
   * Check if a notification exists by ID
   */
  exists(id: NotificationId): Promise<boolean>;

  /**
   * Delete a notification by ID
   */
  delete(id: NotificationId): Promise<void>;

  /**
   * Delete all notifications for a specific item
   */
  deleteByItemId(itemId: ItemId): Promise<void>;

  /**
   * Find pending notifications scheduled before a specific date
   */
  findPendingBefore(date: Date): Promise<Notification[]>;
}
