import type { Item } from "../domain/aggregates/Item";
import type { ItemId } from "../domain/value-objects/ItemId";
import type { CollectionId } from "../domain/value-objects/CollectionId";
import type { MetadataValue } from "../domain/value-objects/MetadataValues";

export interface ItemSearchOptions {
  query?: string;
  collectionId?: CollectionId;
  ownerId?: string;
  metadata?: Record<string, MetadataValue>;
  limit?: number;
  offset?: number;
}

export interface ItemRepository {
  /**
   * Save an item to the repository
   */
  save(item: Item): Promise<void>;

  /**
   * Find an item by its ID
   */
  findById(id: ItemId): Promise<Item | null>;

  /**
   * Find all items belonging to a specific collection
   */
  findByCollectionId(collectionId: CollectionId): Promise<Item[]>;

  /**
   * Find all items belonging to a specific user
   */
  findByOwnerId(ownerId: string): Promise<Item[]>;

  /**
   * Search items with various criteria
   */
  search(options: ItemSearchOptions): Promise<Item[]>;

  /**
   * Check if an item exists by ID
   */
  exists(id: ItemId): Promise<boolean>;

  /**
   * Delete an item by ID
   */
  delete(id: ItemId): Promise<void>;

  /**
   * Count items in a collection
   */
  countByCollectionId(collectionId: CollectionId): Promise<number>;

  /**
   * Find items with specific metadata field values (useful for expiration tracking)
   */
  findByMetadataField(
    fieldName: string,
    value: MetadataValue,
    ownerId?: string,
  ): Promise<Item[]>;
}
