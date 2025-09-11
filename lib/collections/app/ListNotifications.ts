import type {
  NotificationRepository,
  NotificationSearchOptions,
} from "../ports/NotificationRepository";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  userId: string;
  limit?: number;
  offset?: number;
};

export type NotificationSummary = {
  id: string;
  itemId: string;
  type: string;
  message: string;
  scheduledFor: Date;
  deliveredAt?: Date;
  status: string;
  metadata: Record<string, string | number | boolean | Date>;
  createdAt: Date;
};

export type Output = {
  notifications: NotificationSummary[];
  total: number;
};

export class ListNotifications implements UseCase<Input, Output> {
  constructor(
    private deps: {
      notificationRepository: Pick<NotificationRepository, "search">;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const searchOptions: NotificationSearchOptions = {
        userId: input.userId,
        ...(input.limit && { limit: input.limit }),
        ...(input.offset && { offset: input.offset }),
      };

      const notifications =
        await this.deps.notificationRepository.search(searchOptions);

      const notificationSummaries: NotificationSummary[] = notifications.map(
        (notification) => {
          const summary: NotificationSummary = {
            id: notification.getId().getValue(),
            itemId: notification.getItemId().getValue(),
            type: notification.getType().getValue(),
            message: notification.getMessage(),
            scheduledFor: notification.getScheduledFor(),
            status: notification.getStatus().getValue(),
            metadata: notification.getMetadata(),
            createdAt: notification.data.createdAt,
          };

          const deliveredAt = notification.getDeliveredAt();
          if (deliveredAt) {
            summary.deliveredAt = deliveredAt;
          }

          return summary;
        },
      );

      return Result.success({
        notifications: notificationSummaries,
        total: notificationSummaries.length, // Note: This is approximate for paginated results
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
