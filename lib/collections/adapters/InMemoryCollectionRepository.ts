import type { CollectionRepository } from "../ports/CollectionRepository";
import type { Collection } from "../domain/aggregates/Collection";
import type { CollectionId } from "../domain/value-objects/CollectionId";

export class InMemoryCollectionRepository implements CollectionRepository {
  private collections = new Map<string, Collection>();
  private itemCounts = new Map<string, number>();

  async save(collection: Collection): Promise<void> {
    this.collections.set(collection.getId().getValue(), collection);
  }

  async findById(id: CollectionId): Promise<Collection | null> {
    return this.collections.get(id.getValue()) || null;
  }

  async findByOwnerId(ownerId: string): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter((collection) =>
      collection.belongsToUser(ownerId),
    );
  }

  async findByNameAndOwnerId(
    name: string,
    ownerId: string,
  ): Promise<Collection | null> {
    return (
      Array.from(this.collections.values()).find(
        (collection) =>
          collection.getName() === name && collection.belongsToUser(ownerId),
      ) || null
    );
  }

  async exists(id: CollectionId): Promise<boolean> {
    return this.collections.has(id.getValue());
  }

  async delete(id: CollectionId): Promise<void> {
    this.collections.delete(id.getValue());
    this.itemCounts.delete(id.getValue());
  }

  async getItemCount(id: CollectionId): Promise<number> {
    return this.itemCounts.get(id.getValue()) || 0;
  }

  // Test helper methods
  setItemCount(collectionId: CollectionId, count: number): void {
    this.itemCounts.set(collectionId.getValue(), count);
  }

  clear(): void {
    this.collections.clear();
    this.itemCounts.clear();
  }

  getAll(): Collection[] {
    return Array.from(this.collections.values());
  }
}
