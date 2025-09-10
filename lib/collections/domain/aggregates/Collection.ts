import { CollectionId } from "../value-objects/CollectionId";
import { MetadataSchema } from "../value-objects/MetadataSchema";

export class Collection {
  private constructor(
    public readonly data: {
      id: CollectionId;
      name: string;
      description: string;
      ownerId: string; // UserId from IAM domain
      metadataSchema: MetadataSchema;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    Object.freeze(this.data);
  }

  static create(data: {
    name: string;
    description: string;
    ownerId: string;
    metadataSchema: MetadataSchema;
  }): Collection {
    this.validateCreationData(data);

    return new Collection({
      id: CollectionId.create(),
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      metadataSchema: data.metadataSchema,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromData(data: {
    id: CollectionId;
    name: string;
    description: string;
    ownerId: string;
    metadataSchema: MetadataSchema;
    createdAt: Date;
    updatedAt: Date;
  }): Collection {
    return new Collection(data);
  }

  private static validateCreationData(data: {
    name: string;
    description: string;
    ownerId: string;
    metadataSchema: MetadataSchema;
  }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Collection name is required");
    }

    if (data.name.length > 100) {
      throw new Error("Collection name must be 100 characters or less");
    }

    if (data.description.length > 500) {
      throw new Error("Collection description must be 500 characters or less");
    }

    if (!data.ownerId || data.ownerId.trim().length === 0) {
      throw new Error("Collection ownerId is required");
    }

    if (!data.metadataSchema) {
      throw new Error("Collection metadataSchema is required");
    }
  }

  updateName(newName: string): Collection {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Collection name is required");
    }

    if (newName.length > 100) {
      throw new Error("Collection name must be 100 characters or less");
    }

    return new Collection({
      ...this.data,
      name: newName,
      updatedAt: new Date(),
    });
  }

  updateDescription(newDescription: string): Collection {
    if (newDescription.length > 500) {
      throw new Error("Collection description must be 500 characters or less");
    }

    return new Collection({
      ...this.data,
      description: newDescription,
      updatedAt: new Date(),
    });
  }

  updateMetadataSchema(newSchema: MetadataSchema): Collection {
    if (!newSchema) {
      throw new Error("Collection metadataSchema is required");
    }

    return new Collection({
      ...this.data,
      metadataSchema: newSchema,
      updatedAt: new Date(),
    });
  }

  getId(): CollectionId {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getDescription(): string {
    return this.data.description;
  }

  getOwnerId(): string {
    return this.data.ownerId;
  }

  getMetadataSchema(): MetadataSchema {
    return this.data.metadataSchema;
  }

  belongsToUser(userId: string): boolean {
    return this.data.ownerId === userId;
  }
}
