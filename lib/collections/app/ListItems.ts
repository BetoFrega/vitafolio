import type { ItemRepository } from "../ports/ItemRepository";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  collectionId: string;
  ownerId: string;
  limit?: number;
  offset?: number;
};

export type ItemSummary = {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: Date;
  updatedAt: Date;
};

export type Output = {
  items: ItemSummary[];
  total: number;
};

export class ListItems implements UseCase<Input, Output> {
  constructor(
    private deps: {
      itemRepository: Pick<
        ItemRepository,
        "findByCollectionId" | "countByCollectionId"
      >;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const collectionId = CollectionId.fromString(input.collectionId);

      // Get items with pagination
      const allItems =
        await this.deps.itemRepository.findByCollectionId(collectionId);

      // Filter by owner (security check)
      const userItems = allItems.filter((item) =>
        item.belongsToUser(input.ownerId),
      );

      // Apply pagination
      const offset = input.offset || 0;
      const limit = input.limit;

      let paginatedItems = userItems.slice(offset);
      if (limit) {
        paginatedItems = paginatedItems.slice(0, limit);
      }

      const items: ItemSummary[] = paginatedItems.map((item) => ({
        id: item.getId().getValue(),
        name: item.getName(),
        collectionId: item.getCollectionId().getValue(),
        metadata: item.getMetadata().getAllValues(),
        createdAt: item.data.createdAt,
        updatedAt: item.data.updatedAt,
      }));

      return Result.success({
        items,
        total: userItems.length,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
