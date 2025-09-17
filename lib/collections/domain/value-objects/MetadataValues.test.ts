import { describe, it, expect } from "vitest";
import { MetadataValues, type MetadataValue } from "./MetadataValues";
import { MetadataSchema, type MetadataFieldType } from "./MetadataSchema";

describe("MetadataValues", () => {
  describe("create", () => {
    it("should create with valid values matching schema", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
        },
      });

      const values = {
        title: "Test Item",
        priority: 5,
      };

      const metadataValues = MetadataValues.create(values, schema);

      expect(metadataValues.getValue("title")).toBe("Test Item");
      expect(metadataValues.getValue("priority")).toBe(5);
      expect(metadataValues.hasValue("title")).toBe(true);
      expect(metadataValues.hasValue("priority")).toBe(true);
    });

    it("should create with only required fields", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
        },
      });

      const values = {
        title: "Test Item",
      };

      const metadataValues = MetadataValues.create(values, schema);

      expect(metadataValues.getValue("title")).toBe("Test Item");
      expect(metadataValues.hasValue("priority")).toBe(false);
    });

    it("should handle all data types correctly", () => {
      const schema = MetadataSchema.create({
        text_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        number_field: {
          type: "number" as MetadataFieldType,
          required: true,
        },
        date_field: {
          type: "date" as MetadataFieldType,
          required: true,
        },
        boolean_field: {
          type: "boolean" as MetadataFieldType,
          required: true,
        },
      });

      const testDate = new Date("2023-01-01");
      const values = {
        text_field: "Hello World",
        number_field: 42,
        date_field: testDate,
        boolean_field: true,
      };

      const metadataValues = MetadataValues.create(values, schema);

      expect(metadataValues.getValue("text_field")).toBe("Hello World");
      expect(metadataValues.getValue("number_field")).toBe(42);
      expect(metadataValues.getValue("date_field")).toBe(testDate);
      expect(metadataValues.getValue("boolean_field")).toBe(true);
    });

    it("should reject invalid data types", () => {
      const schema = MetadataSchema.create({
        text_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      expect(() => MetadataValues.create({ text_field: 123 }, schema)).toThrow(
        "Field 'text_field' must be a string, got number",
      );

      expect(() => MetadataValues.create({ text_field: true }, schema)).toThrow(
        "Field 'text_field' must be a string, got boolean",
      );
    });

    it("should handle empty values for optional fields", () => {
      const schema = MetadataSchema.create({
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        optional_field: {
          type: "text" as MetadataFieldType,
          required: false,
        },
      });

      const values = {
        required_field: "Present",
      };

      const metadataValues = MetadataValues.create(values, schema);

      expect(metadataValues.hasValue("required_field")).toBe(true);
      expect(metadataValues.hasValue("optional_field")).toBe(false);
    });

    it("should preserve value types", () => {
      const schema = MetadataSchema.create({
        zero_number: {
          type: "number" as MetadataFieldType,
          required: true,
        },
        false_boolean: {
          type: "boolean" as MetadataFieldType,
          required: true,
        },
        empty_string: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const values = {
        zero_number: 0,
        false_boolean: false,
        empty_string: "",
      };

      const metadataValues = MetadataValues.create(values, schema);

      expect(metadataValues.getValue("zero_number")).toBe(0);
      expect(metadataValues.getValue("false_boolean")).toBe(false);
      expect(metadataValues.getValue("empty_string")).toBe("");
    });
  });

  describe("validation against schema", () => {
    it("should pass validation with correct schema", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
          validation: {
            minLength: 3,
            maxLength: 50,
          },
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
          validation: {
            minValue: 1,
            maxValue: 10,
          },
        },
      });

      const values = {
        title: "Valid Title",
        priority: 5,
      };

      expect(() => MetadataValues.create(values, schema)).not.toThrow();
    });

    it("should fail with missing required fields", () => {
      const schema = MetadataSchema.create({
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        optional_field: {
          type: "text" as MetadataFieldType,
          required: false,
        },
      });

      const values = {
        optional_field: "Present",
      };

      expect(() => MetadataValues.create(values, schema)).toThrow(
        "Required field 'required_field' is missing",
      );
    });

    it("should fail with null required fields", () => {
      const schema = MetadataSchema.create({
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const values = {
        required_field: null as unknown as MetadataValue,
      };

      expect(() => MetadataValues.create(values, schema)).toThrow(
        "Required field 'required_field' cannot be null or undefined",
      );
    });

    it("should fail with undefined required fields", () => {
      const schema = MetadataSchema.create({
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const values = {
        required_field: undefined as unknown as MetadataValue,
      };

      expect(() => MetadataValues.create(values, schema)).toThrow(
        "Required field 'required_field' cannot be null or undefined",
      );
    });

    it("should fail with wrong types", () => {
      const schema = MetadataSchema.create({
        number_field: {
          type: "number" as MetadataFieldType,
          required: true,
        },
        date_field: {
          type: "date" as MetadataFieldType,
          required: true,
        },
        boolean_field: {
          type: "boolean" as MetadataFieldType,
          required: true,
        },
      });

      // Include other required fields with valid values so we hit the type error for number_field
      expect(() =>
        MetadataValues.create(
          {
            number_field: "not a number",
            date_field: new Date("2023-01-01"),
            boolean_field: true,
          },
          schema,
        ),
      ).toThrow("Field 'number_field' must be a valid number");

      expect(() =>
        MetadataValues.create(
          {
            number_field: NaN,
            date_field: new Date("2023-01-01"),
            boolean_field: true,
          },
          schema,
        ),
      ).toThrow("Field 'number_field' must be a valid number");

      expect(() =>
        MetadataValues.create(
          {
            number_field: 1,
            date_field: "not a date" as unknown as Date,
            boolean_field: true,
          },
          schema,
        ),
      ).toThrow("Field 'date_field' must be a valid Date");

      expect(() =>
        MetadataValues.create(
          {
            number_field: 1,
            date_field: new Date("invalid"),
            boolean_field: true,
          },
          schema,
        ),
      ).toThrow("Field 'date_field' must be a valid Date");

      expect(() =>
        MetadataValues.create(
          {
            number_field: 1,
            date_field: new Date("2023-01-01"),
            boolean_field: "not a boolean" as unknown as boolean,
          },
          schema,
        ),
      ).toThrow("Field 'boolean_field' must be a boolean");
    });

    it("should handle optional fields correctly", () => {
      const schema = MetadataSchema.create({
        required_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        optional_field: {
          type: "number" as MetadataFieldType,
          required: false,
        },
      });

      // Valid: Only required field provided
      expect(() =>
        MetadataValues.create({ required_field: "Present" }, schema),
      ).not.toThrow();

      // Valid: Both fields provided
      expect(() =>
        MetadataValues.create(
          { required_field: "Present", optional_field: 42 },
          schema,
        ),
      ).not.toThrow();

      // Invalid: Optional field with wrong type
      expect(() =>
        MetadataValues.create(
          { required_field: "Present", optional_field: "not a number" },
          schema,
        ),
      ).toThrow("Field 'optional_field' must be a valid number");
    });

    it("should reject extra fields not in schema", () => {
      const schema = MetadataSchema.create({
        defined_field: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const values = {
        defined_field: "Valid",
        extra_field: "Not defined in schema",
      };

      expect(() => MetadataValues.create(values, schema)).toThrow(
        "Field 'extra_field' is not defined in schema",
      );
    });
  });

  describe("validation rules", () => {
    it("should validate text field length constraints", () => {
      const schema = MetadataSchema.create({
        constrained_text: {
          type: "text" as MetadataFieldType,
          required: true,
          validation: {
            minLength: 5,
            maxLength: 10,
          },
        },
      });

      // Too short
      expect(() =>
        MetadataValues.create({ constrained_text: "Hi" }, schema),
      ).toThrow("Field 'constrained_text' must be at least 5 characters long");

      // Too long
      expect(() =>
        MetadataValues.create(
          { constrained_text: "This is way too long" },
          schema,
        ),
      ).toThrow("Field 'constrained_text' must be at most 10 characters long");

      // Just right
      expect(() =>
        MetadataValues.create({ constrained_text: "Perfect" }, schema),
      ).not.toThrow();
    });

    it("should validate number field range constraints", () => {
      const schema = MetadataSchema.create({
        constrained_number: {
          type: "number" as MetadataFieldType,
          required: true,
          validation: {
            minValue: 10,
            maxValue: 100,
          },
        },
      });

      // Too small
      expect(() =>
        MetadataValues.create({ constrained_number: 5 }, schema),
      ).toThrow("Field 'constrained_number' must be at least 10");

      // Too large
      expect(() =>
        MetadataValues.create({ constrained_number: 200 }, schema),
      ).toThrow("Field 'constrained_number' must be at most 100");

      // Just right
      expect(() =>
        MetadataValues.create({ constrained_number: 50 }, schema),
      ).not.toThrow();
    });

    it("should validate text field pattern constraints", () => {
      const schema = MetadataSchema.create({
        email_field: {
          type: "text" as MetadataFieldType,
          required: true,
          validation: {
            pattern: "^[^@]+@[^@]+\\.[^@]+$",
          },
        },
      });

      // Invalid pattern
      expect(() =>
        MetadataValues.create({ email_field: "invalid-email" }, schema),
      ).toThrow("Field 'email_field' does not match required pattern");

      // Valid pattern
      expect(() =>
        MetadataValues.create({ email_field: "user@example.com" }, schema),
      ).not.toThrow();
    });
  });

  describe("updateValue", () => {
    it("should update existing value successfully", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const originalValues = MetadataValues.create(
        { title: "Original Title" },
        schema,
      );

      const updatedValues = originalValues.updateValue(
        "title",
        "Updated Title",
        schema,
      );

      expect(originalValues.getValue("title")).toBe("Original Title");
      expect(updatedValues.getValue("title")).toBe("Updated Title");
    });

    it("should add new value for defined field", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
        },
      });

      const originalValues = MetadataValues.create({ title: "Title" }, schema);

      const updatedValues = originalValues.updateValue("priority", 5, schema);

      expect(updatedValues.getValue("priority")).toBe(5);
      expect(updatedValues.getValue("title")).toBe("Title");
    });

    it("should reject update for undefined field", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const values = MetadataValues.create({ title: "Title" }, schema);

      expect(() =>
        values.updateValue("undefined_field", "value", schema),
      ).toThrow("Field 'undefined_field' is not defined in schema");
    });

    it("should validate updated value against field definition", () => {
      const schema = MetadataSchema.create({
        number_field: {
          type: "number" as MetadataFieldType,
          required: true,
        },
      });

      const values = MetadataValues.create({ number_field: 10 }, schema);

      expect(() =>
        values.updateValue("number_field", "not a number", schema),
      ).toThrow("Field 'number_field' must be a valid number");
    });
  });

  describe("removeValue", () => {
    it("should remove optional field successfully", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
        },
      });

      const originalValues = MetadataValues.create(
        { title: "Title", priority: 5 },
        schema,
      );

      const updatedValues = originalValues.removeValue("priority", schema);

      expect(updatedValues.hasValue("priority")).toBe(false);
      expect(updatedValues.hasValue("title")).toBe(true);
    });

    it("should reject removing required field", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const values = MetadataValues.create({ title: "Title" }, schema);

      expect(() => values.removeValue("title", schema)).toThrow(
        "Cannot remove required field 'title'",
      );
    });

    it("should return same instance when removing non-existent field", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
        },
      });

      const values = MetadataValues.create({ title: "Title" }, schema);
      const result = values.removeValue("priority", schema);

      expect(result).toBe(values);
    });
  });

  describe("getAllValues", () => {
    it("should return all values as plain object", () => {
      const schema = MetadataSchema.create({
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
          required: false,
        },
      });

      const values = MetadataValues.create(
        {
          title: "Test Item",
          priority: 5,
          completed: false,
        },
        schema,
      );

      const allValues = values.getAllValues();

      expect(allValues).toEqual({
        title: "Test Item",
        priority: 5,
        completed: false,
      });
    });
  });

  describe("fromData", () => {
    it("should create MetadataValues from existing data", () => {
      const data = {
        values: new Map<string, MetadataValue>([
          ["title", "Test Title"],
          ["priority", 5],
          ["completed", true],
        ]),
      };

      const metadataValues = MetadataValues.fromData(data);

      expect(metadataValues.getValue("title")).toBe("Test Title");
      expect(metadataValues.getValue("priority")).toBe(5);
      expect(metadataValues.getValue("completed")).toBe(true);
    });
  });

  describe("immutability", () => {
    it("should not allow direct modification of data container", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
      });

      const values = MetadataValues.create({ title: "Original" }, schema);

      // The container object should be frozen
      expect(Object.isFrozen(values.data)).toBe(true);

      // Reassigning properties on frozen container should throw
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (values.data as any).values = new Map();
      }).toThrow();
    });

    it("should return new instance on modifications", () => {
      const schema = MetadataSchema.create({
        title: {
          type: "text" as MetadataFieldType,
          required: true,
        },
        priority: {
          type: "number" as MetadataFieldType,
          required: false,
        },
      });

      const originalValues = MetadataValues.create(
        { title: "Original" },
        schema,
      );
      const updatedValues = originalValues.updateValue("priority", 5, schema);

      expect(originalValues).not.toBe(updatedValues);
      expect(originalValues.hasValue("priority")).toBe(false);
      expect(updatedValues.hasValue("priority")).toBe(true);
    });
  });
});
