import type { CollectionRepository } from "../ports/CollectionRepository";
import type { ValidationRules } from "../domain/value-objects/MetadataSchema";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  ownerId: string;
};

export type CollectionSummary = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
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
  };
  createdAt: Date;
  updatedAt: Date;
};

export type Output = {
  collections: CollectionSummary[];
};

export class ListCollections implements UseCase<Input, Output> {
  constructor(
    private deps: {
      collectionRepository: Pick<
        CollectionRepository,
        "findByOwnerId" | "getItemCount"
      >;
    },
  ) {}

  async execute(input: Input): Promise<Result<Output>> {
    try {
      const collections = await this.deps.collectionRepository.findByOwnerId(
        input.ownerId,
      );

      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          const itemCount = await this.deps.collectionRepository.getItemCount(
            collection.getId(),
          );

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

          return {
            id: collection.getId().getValue(),
            name: collection.getName(),
            description: collection.getDescription(),
            itemCount,
            metadataSchema: {
              fields,
              requiredFields: collection
                .getMetadataSchema()
                .getRequiredFields(),
            },
            createdAt: collection.data.createdAt,
            updatedAt: collection.data.updatedAt,
          };
        }),
      );

      return Result.success({
        collections: collectionsWithCounts,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
