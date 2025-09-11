import type { CollectionRepository } from "../ports/CollectionRepository";
import { Collection } from "../domain/aggregates/Collection";
import { MetadataSchema } from "../domain/value-objects/MetadataSchema";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  name: string;
  description: string;
  ownerId: string;
  metadataSchema: {
    fields: Record<
      string,
      {
        type: "text" | "number" | "date" | "boolean";
        required: boolean;
        validation?: {
          minLength?: number;
          maxLength?: number;
          minValue?: number;
          maxValue?: number;
          pattern?: string;
        };
        description?: string;
      }
    >;
  };
};

export type Output = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class CreateCollection implements UseCase<Input, Output> {
  constructor(
    private deps: {
      collectionRepository: Pick<
        CollectionRepository,
        "save" | "findByNameAndOwnerId"
      >;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      // Check if collection with same name already exists for this user
      const existingCollection =
        await this.deps.collectionRepository.findByNameAndOwnerId(
          input.name,
          input.ownerId,
        );

      if (existingCollection) {
        return Result.failure(
          new Error(`Collection with name "${input.name}" already exists`),
        );
      }

      // Create metadata schema
      const metadataSchema = MetadataSchema.create(input.metadataSchema.fields);

      // Create collection
      const collection = Collection.create({
        name: input.name,
        description: input.description,
        ownerId: input.ownerId,
        metadataSchema,
      });

      // Save to repository
      await this.deps.collectionRepository.save(collection);

      return Result.success({
        id: collection.getId().getValue(),
        name: collection.getName(),
        description: collection.getDescription(),
        ownerId: collection.getOwnerId(),
        createdAt: collection.data.createdAt,
        updatedAt: collection.data.updatedAt,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
