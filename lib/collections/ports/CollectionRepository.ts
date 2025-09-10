import type { Collection } from "../domain/aggregates/Collection";
import type { CollectionId } from "../domain/value-objects/CollectionId";

export interface CollectionRepository {
  /**
   * Save a collection to the repository
   */
  save(collection: Collection): Promise<void>;

  /**
   * Find a collection by its ID
   */
  findById(id: CollectionId): Promise<Collection | null>;

  /**
   * Find all collections belonging to a specific user
   */
  findByOwnerId(ownerId: string): Promise<Collection[]>;

  /**
   * Find a collection by name within a user's collections
   */
  findByNameAndOwnerId(
    name: string,
    ownerId: string,
  ): Promise<Collection | null>;

  /**
   * Check if a collection exists by ID
   */
  exists(id: CollectionId): Promise<boolean>;

  /**
   * Delete a collection by ID
   */
  delete(id: CollectionId): Promise<void>;

  /**
   * Get the count of items in a collection
   */
  getItemCount(id: CollectionId): Promise<number>;
}
