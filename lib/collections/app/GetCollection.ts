import type { CollectionRepository } from "../ports/CollectionRepository";
import type { ValidationRules } from "../domain/value-objects/MetadataSchema";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  collectionId: string;
  ownerId: string;
};

export type Output = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  metadataSchema: {
    fields: Record<
      string,
      {
        type: string;
        required: boolean;
        validation?: ValidationRules;
        description?: string;
      }
    >;
    requiredFields: string[];
    version: number;
    lastModified: Date;
  };
  createdAt: Date;
  updatedAt: Date;
};

export class GetCollection implements UseCase<Input, Output> {
  constructor(
    private deps: {
      collectionRepository: Pick<CollectionRepository, "findById">;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const collectionId = CollectionId.fromString(input.collectionId);
      const collection =
        await this.deps.collectionRepository.findById(collectionId);

      if (!collection) {
        return Result.failure(new Error("Collection not found"));
      }

      if (!collection.belongsToUser(input.ownerId)) {
        return Result.failure(new Error("Collection not found"));
      }

      const fields: Record<
        string,
        {
          type: string;
          required: boolean;
          validation?: ValidationRules;
          description?: string;
        }
      > = {};
      for (const field of collection.getMetadataSchema().getAllFields()) {
        fields[field.name] = {
          type: field.type,
          required: field.required,
          ...(field.validation && { validation: field.validation }),
          ...(field.description && { description: field.description }),
        };
      }

      return Result.success({
        id: collection.getId().getValue(),
        name: collection.getName(),
        description: collection.getDescription(),
        ownerId: collection.getOwnerId(),
        metadataSchema: {
          fields,
          requiredFields: collection.getMetadataSchema().getRequiredFields(),
          version: collection.getMetadataSchema().data.version,
          lastModified: collection.getMetadataSchema().data.lastModified,
        },
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
