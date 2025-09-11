import { ItemId } from "../value-objects/ItemId";
import { CollectionId } from "../value-objects/CollectionId";
import {
  MetadataValues,
  type MetadataValue,
} from "../value-objects/MetadataValues";
import type { MetadataSchema } from "../value-objects/MetadataSchema";

export class Item {
  private constructor(
    public readonly data: {
      id: ItemId;
      name: string;
      collectionId: CollectionId;
      ownerId: string; // UserId from IAM domain (derived from collection)
      metadata: MetadataValues;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    Object.freeze(this.data);
  }

  static create(data: {
    name: string;
    collectionId: CollectionId;
    ownerId: string;
    metadata: MetadataValues;
  }): Item {
    this.validateCreationData(data);

    return new Item({
      id: ItemId.create(),
      name: data.name,
      collectionId: data.collectionId,
      ownerId: data.ownerId,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromData(data: {
    id: ItemId;
    name: string;
    collectionId: CollectionId;
    ownerId: string;
    metadata: MetadataValues;
    createdAt: Date;
    updatedAt: Date;
  }): Item {
    return new Item(data);
  }

  private static validateCreationData(data: {
    name: string;
    collectionId: CollectionId;
    ownerId: string;
    metadata: MetadataValues;
  }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Item name is required");
    }

    if (data.name.length > 200) {
      throw new Error("Item name must be 200 characters or less");
    }

    if (!data.collectionId) {
      throw new Error("Item collectionId is required");
    }

    if (!data.ownerId || data.ownerId.trim().length === 0) {
      throw new Error("Item ownerId is required");
    }

    if (!data.metadata) {
      throw new Error("Item metadata is required");
    }
  }

  updateName(newName: string): Item {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Item name is required");
    }

    if (newName.length > 200) {
      throw new Error("Item name must be 200 characters or less");
    }

    return new Item({
      ...this.data,
      name: newName,
      updatedAt: new Date(),
    });
  }

  updateMetadata(newMetadata: MetadataValues, schema: MetadataSchema): Item {
    if (!newMetadata) {
      throw new Error("Item metadata is required");
    }

    // Validate metadata against schema
    MetadataValues.create(newMetadata.getAllValues(), schema);

    return new Item({
      ...this.data,
      metadata: newMetadata,
      updatedAt: new Date(),
    });
  }

  getId(): ItemId {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getCollectionId(): CollectionId {
    return this.data.collectionId;
  }

  getOwnerId(): string {
    return this.data.ownerId;
  }

  getMetadata(): MetadataValues {
    return this.data.metadata;
  }

  belongsToUser(userId: string): boolean {
    return this.data.ownerId === userId;
  }

  belongsToCollection(collectionId: CollectionId): boolean {
    return this.data.collectionId.equals(collectionId);
  }

  getMetadataValue(fieldName: string): MetadataValue | undefined {
    return this.data.metadata.getValue(fieldName);
  }

  hasMetadataValue(fieldName: string): boolean {
    return this.data.metadata.hasValue(fieldName);
  }
}
