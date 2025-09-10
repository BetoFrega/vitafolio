import type { CollectionRepository } from "../ports/CollectionRepository";
import type { ItemRepository } from "../ports/ItemRepository";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { Item } from "../domain/aggregates/Item";
import { MetadataValues } from "../domain/value-objects/MetadataValues";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  collectionId: string;
  ownerId: string;
  name: string;
  metadata: Record<string, string | number | Date | boolean>;
};

export type Output = {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: Date;
  updatedAt: Date;
};

export class AddItemToCollection implements UseCase<Input, Output> {
  constructor(
    private deps: {
      collectionRepository: Pick<CollectionRepository, "findById">;
      itemRepository: Pick<ItemRepository, "save">;
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

      // Validate metadata against collection schema
      const metadataValues = MetadataValues.create(
        input.metadata,
        collection.getMetadataSchema(),
      );

      // Create the item
      const item = Item.create({
        name: input.name,
        collectionId: collectionId,
        ownerId: input.ownerId,
        metadata: metadataValues,
      });

      await this.deps.itemRepository.save(item);

      return Result.success({
        id: item.getId().getValue(),
        name: item.getName(),
        collectionId: item.getCollectionId().getValue(),
        metadata: item.getMetadata().getAllValues(),
        createdAt: item.data.createdAt,
        updatedAt: item.data.updatedAt,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
