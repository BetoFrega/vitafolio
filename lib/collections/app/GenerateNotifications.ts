import type { ItemRepository } from "../ports/ItemRepository";
import type { NotificationRepository } from "../ports/NotificationRepository";
import { Notification } from "../domain/aggregates/Notification";
import { NotificationType } from "../domain/value-objects/NotificationType";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  ownerId: string;
};

export type Output = {
  generatedCount: number;
  notifications: Array<{
    id: string;
    itemId: string;
    type: string;
    message: string;
    scheduledFor: Date;
  }>;
};

export class GenerateNotifications implements UseCase<Input, Output> {
  constructor(
    private deps: {
      itemRepository: Pick<ItemRepository, "findByOwnerId">;
      notificationRepository: Pick<
        NotificationRepository,
        "save" | "findByItemId"
      >;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const items = await this.deps.itemRepository.findByOwnerId(input.ownerId);
      const generatedNotifications: Array<{
        id: string;
        itemId: string;
        type: string;
        message: string;
        scheduledFor: Date;
      }> = [];

      for (const item of items) {
        // Check for expiration dates in metadata
        const expirationDate = item.getMetadataValue("expirationDate");
        const expiry = item.getMetadataValue("expiry");
        const expires = item.getMetadataValue("expires");

        const expDate = expirationDate || expiry || expires;

        if (expDate instanceof Date) {
          // Check if we already have notifications for this item
          const existingNotifications =
            await this.deps.notificationRepository.findByItemId(item.getId());
          const hasExpirationNotification = existingNotifications.some(
            (n) =>
              n.getType().equals(NotificationType.expiration()) &&
              n.isPending(),
          );

          if (!hasExpirationNotification) {
            // Generate notification for 3 days before expiration
            const notificationDate = new Date(expDate);
            notificationDate.setDate(notificationDate.getDate() - 3);

            // Only create notification if it's in the future
            if (notificationDate > new Date()) {
              const notification = Notification.create({
                userId: input.ownerId,
                itemId: item.getId(),
                type: NotificationType.expiration(),
                message: `${item.getName()} will expire on ${expDate.toLocaleDateString()}`,
                scheduledFor: notificationDate,
                metadata: {
                  itemName: item.getName(),
                  expirationDate: expDate.toISOString(),
                  daysBeforeExpiration: 3,
                },
              });

              await this.deps.notificationRepository.save(notification);

              generatedNotifications.push({
                id: notification.getId().getValue(),
                itemId: item.getId().getValue(),
                type: notification.getType().getValue(),
                message: notification.getMessage(),
                scheduledFor: notification.getScheduledFor(),
              });
            }
          }
        }

        // Check for maintenance dates
        const maintenanceDate = item.getMetadataValue("maintenanceDate");
        const nextMaintenance = item.getMetadataValue("nextMaintenance");

        const maintDate = maintenanceDate || nextMaintenance;

        if (maintDate instanceof Date) {
          const existingNotifications =
            await this.deps.notificationRepository.findByItemId(item.getId());
          const hasMaintenanceNotification = existingNotifications.some(
            (n) =>
              n.getType().equals(NotificationType.maintenance()) &&
              n.isPending(),
          );

          if (!hasMaintenanceNotification) {
            // Generate notification for 1 week before maintenance
            const notificationDate = new Date(maintDate);
            notificationDate.setDate(notificationDate.getDate() - 7);

            if (notificationDate > new Date()) {
              const notification = Notification.create({
                userId: input.ownerId,
                itemId: item.getId(),
                type: NotificationType.maintenance(),
                message: `${item.getName()} is due for maintenance on ${maintDate.toLocaleDateString()}`,
                scheduledFor: notificationDate,
                metadata: {
                  itemName: item.getName(),
                  maintenanceDate: maintDate.toISOString(),
                  daysBeforeMaintenance: 7,
                },
              });

              await this.deps.notificationRepository.save(notification);

              generatedNotifications.push({
                id: notification.getId().getValue(),
                itemId: item.getId().getValue(),
                type: notification.getType().getValue(),
                message: notification.getMessage(),
                scheduledFor: notification.getScheduledFor(),
              });
            }
          }
        }
      }

      return Result.success({
        generatedCount: generatedNotifications.length,
        notifications: generatedNotifications,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
