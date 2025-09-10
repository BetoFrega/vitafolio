import type { ItemRepository } from "../ports/ItemRepository";
import type { NotificationRepository } from "../ports/NotificationRepository";
import { ItemId } from "../domain/value-objects/ItemId";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  itemId: string;
  ownerId: string;
};

export type Output = {
  success: boolean;
};

export class DeleteItem implements UseCase<Input, Output> {
  constructor(
    private deps: {
      itemRepository: Pick<ItemRepository, "findById" | "delete">;
      notificationRepository: Pick<NotificationRepository, "deleteByItemId">;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const itemId = ItemId.fromString(input.itemId);
      const item = await this.deps.itemRepository.findById(itemId);

      if (!item) {
        return Result.failure(new Error("Item not found"));
      }

      if (!item.belongsToUser(input.ownerId)) {
        return Result.failure(new Error("Item not found"));
      }

      // Delete all notifications for this item first
      await this.deps.notificationRepository.deleteByItemId(itemId);

      // Delete the item
      await this.deps.itemRepository.delete(itemId);

      return Result.success({
        success: true,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
