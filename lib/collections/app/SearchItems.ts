import type {
  ItemRepository,
  ItemSearchOptions,
} from "../ports/ItemRepository";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  query?: string;
  ownerId: string;
  collectionId?: string;
  metadata?: Record<string, string | number | Date | boolean>;
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

export class SearchItems implements UseCase<Input, Output> {
  constructor(
    private deps: {
      itemRepository: Pick<ItemRepository, "search">;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const searchOptions: ItemSearchOptions = {
        ownerId: input.ownerId,
        ...(input.query && { query: input.query }),
        ...(input.metadata && { metadata: input.metadata }),
        ...(input.limit && { limit: input.limit }),
        ...(input.offset && { offset: input.offset }),
      };

      // Add collectionId to search if provided
      if (input.collectionId) {
        searchOptions.collectionId = CollectionId.fromString(
          input.collectionId,
        );
      }

      const items = await this.deps.itemRepository.search(searchOptions);

      const itemSummaries: ItemSummary[] = items.map((item) => ({
        id: item.getId().getValue(),
        name: item.getName(),
        collectionId: item.getCollectionId().getValue(),
        metadata: item.getMetadata().getAllValues(),
        createdAt: item.data.createdAt,
        updatedAt: item.data.updatedAt,
      }));

      return Result.success({
        items: itemSummaries,
        total: itemSummaries.length, // Note: This is approximate for paginated results
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
