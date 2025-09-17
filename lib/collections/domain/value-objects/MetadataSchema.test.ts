import { describe, it, expect } from "vitest";
import { MetadataSchema, type MetadataFieldType } from "./MetadataSchema";

describe("MetadataSchema", () => {
  describe("create", () => {
    it("should create valid schema with text field", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text",
          required: true,
          description: "Item title",
        },
      });

      expect(schema.hasField("title")).toBe(true);
      expect(schema.isFieldRequired("title")).toBe(true);
      expect(schema.getField("title")).toMatchObject({
        name: "title",
        type: "text",
        required: true,
        description: "Item title",
      });
    });

    it("should create valid schema with number field", () => {
      const fields = {
        price: {
          type: "number" as MetadataFieldType,
          required: false,
          validation: {
            minValue: 0,
            maxValue: 1000,
          },
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(schema.hasField("price")).toBe(true);
      expect(schema.isFieldRequired("price")).toBe(false);
      const field = schema.getField("price");
      expect(field?.validation?.minValue).toBe(0);
      expect(field?.validation?.maxValue).toBe(1000);
    });

    it("should create valid schema with boolean field", () => {
      const fields = {
        is_active: {
          type: "boolean" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(schema.hasField("is_active")).toBe(true);
      expect(schema.getField("is_active")?.type).toBe("boolean");
    });

    it("should create valid schema with date field", () => {
      const fields = {
        due_date: {
          type: "date" as MetadataFieldType,
          required: false,
          description: "Due date for task",
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(schema.hasField("due_date")).toBe(true);
      expect(schema.getField("due_date")?.type).toBe("date");
    });

    it("should create schema with multiple fields", () => {
      const fields = {
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
        },
        completed: {
          type: "boolean" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(schema.getAllFields()).toHaveLength(3);
      expect(schema.getRequiredFields()).toEqual(
        expect.arrayContaining(["title", "completed"]),
      );
      expect(schema.getRequiredFields()).toHaveLength(2);
    });

    it("should validate required fields correctly", () => {
      const fields = {
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        optional_field: {
          type: "text" as MetadataFieldType,
          required: false,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(schema.isFieldRequired("required_field")).toBe(true);
      expect(schema.isFieldRequired("optional_field")).toBe(false);
      expect(schema.isFieldRequired("nonexistent")).toBe(false);
    });

    it("should reject invalid field types", () => {
      const fields = {
        invalid_field: {
          type: "invalid_type" as MetadataFieldType,
          required: true,
        },
      };

      expect(() => MetadataSchema.create(fields)).toThrow(
        "Invalid field type: invalid_type. Must be one of: text, number, date, boolean",
      );
    });

    it("should reject empty schema", () => {
      expect(() => MetadataSchema.create({})).toThrow(
        "MetadataSchema must contain at least one field definition",
      );
    });

    it("should reject invalid field names", () => {
      const invalidNames = ["123invalid", "invalid-name", "invalid name", ""];

      for (const invalidName of invalidNames) {
        const fields = {
          [invalidName]: {
            type: "text" as MetadataFieldType,
            required: true,
          },
        };

        expect(() => MetadataSchema.create(fields)).toThrow(
          `Invalid field name: ${invalidName}. Must be alphanumeric with underscores only`,
        );
      }
    });

    it("should accept valid field names", () => {
      const validNames = ["title", "field_name", "field123", "Title", "FIELD"];

      for (const validName of validNames) {
        const fields = {
          [validName]: {
            type: "text" as MetadataFieldType,
            required: true,
          },
        };

        expect(() => MetadataSchema.create(fields)).not.toThrow();
      }
    });

    it("should handle nested field descriptions", () => {
      const fields = {
        complex_field: {
          type: "text" as MetadataFieldType,
          required: true,
          description:
            "A complex field with multiple purposes and validation rules",
          validation: {
            minLength: 5,
            maxLength: 100,
            pattern: "^[A-Za-z0-9\\s]+$",
          },
        },
      };

      const schema = MetadataSchema.create(fields);
      const field = schema.getField("complex_field");

      expect(field?.description).toBe(
        "A complex field with multiple purposes and validation rules",
      );
      expect(field?.validation?.minLength).toBe(5);
      expect(field?.validation?.maxLength).toBe(100);
      expect(field?.validation?.pattern).toBe("^[A-Za-z0-9\\s]+$");
    });

    it("should set version and timestamp on creation", () => {
      const fields = {
        test_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(schema.data.version).toBe(1);
      expect(schema.data.lastModified).toBeInstanceOf(Date);
      expect(schema.data.lastModified.getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });
  });

  describe("addField", () => {
    it("should add new field successfully", () => {
      const initialFields = {
        existing_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(initialFields);
      const updatedSchema = schema.addField("new_field", {
        type: "number" as MetadataFieldType,
        required: false,
      });

      expect(updatedSchema.hasField("existing_field")).toBe(true);
      expect(updatedSchema.hasField("new_field")).toBe(true);
      expect(updatedSchema.getField("new_field")?.type).toBe("number");
      expect(updatedSchema.data.version).toBe(schema.data.version + 1);
    });

    it("should reject duplicate field names", () => {
      const fields = {
        existing_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(() =>
        schema.addField("existing_field", {
          type: "number" as MetadataFieldType,
          required: false,
        }),
      ).toThrow("Field existing_field already exists");
    });
  });

  describe("removeField", () => {
    it("should remove optional field successfully", () => {
      const fields = {
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        optional_field: {
          type: "text" as MetadataFieldType,
          required: false,
        },
      };

      const schema = MetadataSchema.create(fields);
      const updatedSchema = schema.removeField("optional_field");

      expect(updatedSchema.hasField("required_field")).toBe(true);
      expect(updatedSchema.hasField("optional_field")).toBe(false);
      expect(updatedSchema.data.version).toBe(schema.data.version + 1);
    });

    it("should reject removing required field", () => {
      const fields = {
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(() => schema.removeField("required_field")).toThrow(
        "Cannot remove required field required_field",
      );
    });

    it("should reject removing non-existent field", () => {
      const fields = {
        existing_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(() => schema.removeField("nonexistent_field")).toThrow(
        "Field nonexistent_field does not exist",
      );
    });

    it("should reject removing last field", () => {
      const fields = {
        only_field: {
          type: "text" as MetadataFieldType,
          required: false,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(() => schema.removeField("only_field")).toThrow(
        "Cannot remove the last field from schema",
      );
    });
  });

  describe("fromData", () => {
    it("should create schema from existing data", () => {
      const data = {
        fields: new Map([
          [
            "test_field",
            {
              name: "test_field",
              type: "text" as MetadataFieldType,
              required: true,
            },
          ],
        ]),
        requiredFields: new Set(["test_field"]),
        version: 5,
        lastModified: new Date("2023-01-01T00:00:00Z"),
      };

      const schema = MetadataSchema.fromData(data);

      expect(schema.hasField("test_field")).toBe(true);
      expect(schema.data.version).toBe(5);
      expect(schema.data.lastModified).toEqual(
        new Date("2023-01-01T00:00:00Z"),
      );
    });
  });

  describe("immutability", () => {
    it("should not allow direct modification of data", () => {
      const fields = {
        test_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      };

      const schema = MetadataSchema.create(fields);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schema.data as any).version = 999;
      }).toThrow();
    });

    it("should return new instance on modifications", () => {
      const fields = {
        original_field: {
          type: "text" as MetadataFieldType,
          required: false,
        },
      };

      const originalSchema = MetadataSchema.create(fields);
      const modifiedSchema = originalSchema.addField("new_field", {
        type: "number" as MetadataFieldType,
        required: true,
      });

      expect(originalSchema).not.toBe(modifiedSchema);
      expect(originalSchema.hasField("new_field")).toBe(false);
      expect(modifiedSchema.hasField("new_field")).toBe(true);
    });
  });
});
