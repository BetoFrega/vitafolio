import type { CollectionRepository } from "../ports/CollectionRepository";
import type { ItemRepository } from "../ports/ItemRepository";
import type { NotificationRepository } from "../ports/NotificationRepository";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  collectionId: string;
  ownerId: string;
};

export type Output = {
  success: boolean;
};

export class DeleteCollection implements UseCase<Input, Output> {
  constructor(
    private deps: {
      collectionRepository: Pick<CollectionRepository, "findById" | "delete">;
      itemRepository: Pick<ItemRepository, "findByCollectionId" | "delete">;
      notificationRepository: Pick<NotificationRepository, "deleteByItemId">;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const collectionId = CollectionId.fromString(input.collectionId);
      const collection =
        await this.deps.collectionRepository.findById(collectionId);

      if (!collection) {
        return Result.failure(new Error("Collection not found"));
      }

      if (!collection.belongsToUser(input.ownerId)) {
        return Result.failure(new Error("Collection not found"));
      }

      // Get all items in the collection
      const items =
        await this.deps.itemRepository.findByCollectionId(collectionId);

      // Delete all notifications for items in this collection
      for (const item of items) {
        await this.deps.notificationRepository.deleteByItemId(item.getId());
      }

      // Delete all items in the collection
      for (const item of items) {
        await this.deps.itemRepository.delete(item.getId());
      }

      // Finally delete the collection
      await this.deps.collectionRepository.delete(collectionId);

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
