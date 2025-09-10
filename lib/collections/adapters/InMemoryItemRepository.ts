import type {
  ItemRepository,
  ItemSearchOptions,
} from "../ports/ItemRepository";
import type { Item } from "../domain/aggregates/Item";
import type { ItemId } from "../domain/value-objects/ItemId";
import type { CollectionId } from "../domain/value-objects/CollectionId";
import type { MetadataValue } from "../domain/value-objects/MetadataValues";

export class InMemoryItemRepository implements ItemRepository {
  private items = new Map<string, Item>();

  async save(item: Item): Promise<void> {
    this.items.set(item.getId().getValue(), item);
  }

  async findById(id: ItemId): Promise<Item | null> {
    return this.items.get(id.getValue()) || null;
  }

  async findByCollectionId(collectionId: CollectionId): Promise<Item[]> {
    return Array.from(this.items.values()).filter((item) =>
      item.belongsToCollection(collectionId),
    );
  }

  async findByOwnerId(ownerId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter((item) =>
      item.belongsToUser(ownerId),
    );
  }

  async search(options: ItemSearchOptions): Promise<Item[]> {
    let results = Array.from(this.items.values());

    // Filter by owner
    if (options.ownerId) {
      results = results.filter((item) => item.belongsToUser(options.ownerId!));
    }

    // Filter by collection
    if (options.collectionId) {
      results = results.filter((item) =>
        item.belongsToCollection(options.collectionId!),
      );
    }

    // Filter by query (search in name and metadata values)
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter((item) => {
        // Search in item name
        if (item.getName().toLowerCase().includes(query)) {
          return true;
        }

        // Search in metadata values
        const metadata = item.getMetadata().getAllValues();
        return Object.values(metadata).some((value) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(query);
          }
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // Filter by metadata fields
    if (options.metadata) {
      results = results.filter((item) => {
        return Object.entries(options.metadata!).every(
          ([fieldName, fieldValue]) => {
            const itemValue = item.getMetadataValue(fieldName);
            return itemValue === fieldValue;
          },
        );
      });
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit;

    if (limit) {
      return results.slice(offset, offset + limit);
    }

    return results.slice(offset);
  }

  async exists(id: ItemId): Promise<boolean> {
    return this.items.has(id.getValue());
  }

  async delete(id: ItemId): Promise<void> {
    this.items.delete(id.getValue());
  }

  async countByCollectionId(collectionId: CollectionId): Promise<number> {
    return Array.from(this.items.values()).filter((item) =>
      item.belongsToCollection(collectionId),
    ).length;
  }

  async findByMetadataField(
    fieldName: string,
    value: MetadataValue,
    ownerId?: string,
  ): Promise<Item[]> {
    let results = Array.from(this.items.values());

    if (ownerId) {
      results = results.filter((item) => item.belongsToUser(ownerId));
    }

    return results.filter((item) => {
      const metadataValue = item.getMetadataValue(fieldName);
      return metadataValue === value;
    });
  }

  // Test helper methods
  clear(): void {
    this.items.clear();
  }

  getAll(): Item[] {
    return Array.from(this.items.values());
  }
}
