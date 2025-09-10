import type { ItemRepository } from "../ports/ItemRepository";
import type { CollectionRepository } from "../ports/CollectionRepository";
import { ItemId } from "../domain/value-objects/ItemId";
import { MetadataValues } from "../domain/value-objects/MetadataValues";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  itemId: string;
  ownerId: string;
  name?: string;
  metadata?: Record<string, string | number | Date | boolean>;
};

export type Output = {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  updatedAt: Date;
};

export class UpdateItem implements UseCase<Input, Output> {
  constructor(
    private deps: {
      itemRepository: Pick<ItemRepository, "findById" | "save">;
      collectionRepository: Pick<CollectionRepository, "findById">;
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

      let updatedItem = item;

      // Update name if provided
      if (input.name !== undefined) {
        updatedItem = updatedItem.updateName(input.name);
      }

      // Update metadata if provided
      if (input.metadata !== undefined) {
        // Get the collection to validate metadata against schema
        const collection = await this.deps.collectionRepository.findById(
          item.getCollectionId(),
        );
        if (!collection) {
          return Result.failure(new Error("Collection not found"));
        }

        const newMetadataValues = MetadataValues.create(
          input.metadata,
          collection.getMetadataSchema(),
        );
        updatedItem = updatedItem.updateMetadata(
          newMetadataValues,
          collection.getMetadataSchema(),
        );
      }

      await this.deps.itemRepository.save(updatedItem);

      return Result.success({
        id: updatedItem.getId().getValue(),
        name: updatedItem.getName(),
        collectionId: updatedItem.getCollectionId().getValue(),
        metadata: updatedItem.getMetadata().getAllValues(),
        updatedAt: updatedItem.data.updatedAt,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
