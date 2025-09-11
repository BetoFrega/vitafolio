import type { CollectionRepository } from "../ports/CollectionRepository";
import type { ItemRepository } from "../ports/ItemRepository";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { MetadataSchema } from "../domain/value-objects/MetadataSchema";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  collectionId: string;
  ownerId: string;
  name?: string;
  description?: string;
  metadataSchema?: {
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
  updatedAt: Date;
};

export class UpdateCollection implements UseCase<Input, Output> {
  constructor(
    private deps: {
      collectionRepository: Pick<
        CollectionRepository,
        "findById" | "save" | "findByNameAndOwnerId"
      >;
      itemRepository: Pick<ItemRepository, "findByCollectionId">;
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

      let updatedCollection = collection;

      // Update name if provided
      if (input.name !== undefined) {
        if (input.name !== collection.getName()) {
          // Check if another collection with this name exists
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

          updatedCollection = updatedCollection.updateName(input.name);
        }
      }

      // Update description if provided
      if (input.description !== undefined) {
        updatedCollection = updatedCollection.updateDescription(
          input.description,
        );
      }

      // Update metadata schema if provided
      if (input.metadataSchema) {
        // Check if we can safely update the schema
        const items =
          await this.deps.itemRepository.findByCollectionId(collectionId);

        // For now, we'll create a new schema and validate compatibility later
        // In a real implementation, you'd want to validate schema evolution rules
        const newSchema = MetadataSchema.create(input.metadataSchema.fields);

        // Basic validation: ensure all existing items would still be valid
        // This is a simplified check - in production you'd want more sophisticated schema evolution
        const currentRequiredFields = collection
          .getMetadataSchema()
          .getRequiredFields();
        const newRequiredFields = newSchema.getRequiredFields();

        // Check if any new required fields were added
        const addedRequiredFields = newRequiredFields.filter(
          (field) => !currentRequiredFields.includes(field),
        );

        if (addedRequiredFields.length > 0 && items.length > 0) {
          return Result.failure(
            new Error(
              `Cannot add required fields to schema when items exist: ${addedRequiredFields.join(", ")}`,
            ),
          );
        }

        updatedCollection = updatedCollection.updateMetadataSchema(newSchema);
      }

      await this.deps.collectionRepository.save(updatedCollection);

      return Result.success({
        id: updatedCollection.getId().getValue(),
        name: updatedCollection.getName(),
        description: updatedCollection.getDescription(),
        ownerId: updatedCollection.getOwnerId(),
        updatedAt: updatedCollection.data.updatedAt,
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
  }
}
