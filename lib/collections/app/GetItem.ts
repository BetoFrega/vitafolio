import type { ItemRepository } from "../ports/ItemRepository";
import { ItemId } from "../domain/value-objects/ItemId";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  itemId: string;
  ownerId: string;
};

export type Output = {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: Date;
  updatedAt: Date;
};

export class GetItem implements UseCase<Input, Output> {
  constructor(
    private deps: {
      itemRepository: Pick<ItemRepository, "findById">;
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
