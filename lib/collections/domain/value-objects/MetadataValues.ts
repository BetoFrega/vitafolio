import type { MetadataSchema, MetadataFieldDefinition } from "./MetadataSchema";

export type MetadataValue = string | number | Date | boolean;

export class MetadataValues {
  private constructor(
    public readonly data: {
      values: Map<string, MetadataValue>;
    },
  ) {
    Object.freeze(this.data);
  }

  static create(
    values: Record<string, MetadataValue>,
    schema: MetadataSchema,
  ): MetadataValues {
    this.validateAgainstSchema(values, schema);

    const valuesMap = new Map<string, MetadataValue>();

    for (const [key, value] of Object.entries(values)) {
      valuesMap.set(key, value);
    }

    return new MetadataValues({
      values: valuesMap,
    });
  }

  static fromData(data: {
    values: Map<string, MetadataValue>;
  }): MetadataValues {
    return new MetadataValues(data);
  }

  private static validateAgainstSchema(
    values: Record<string, MetadataValue>,
    schema: MetadataSchema,
  ): void {
    // Check all required fields are present
    for (const requiredField of schema.getRequiredFields()) {
      if (!(requiredField in values)) {
        throw new Error(`Required field '${requiredField}' is missing`);
      }

      const value = values[requiredField];
      if (value === null || value === undefined) {
        throw new Error(
          `Required field '${requiredField}' cannot be null or undefined`,
        );
      }
    }

    // Check no extra fields beyond schema
    for (const fieldName of Object.keys(values)) {
      if (!schema.hasField(fieldName)) {
        throw new Error(`Field '${fieldName}' is not defined in schema`);
      }

      const fieldDef = schema.getField(fieldName)!;
      const value = values[fieldName];

      if (value !== undefined) {
        this.validateFieldValue(fieldName, value, fieldDef);
      }
    }
  }

  private static validateFieldValue(
    fieldName: string,
    value: MetadataValue,
    fieldDef: MetadataFieldDefinition,
  ): void {
    // Type validation
    switch (fieldDef.type) {
      case "text":
        if (typeof value !== "string") {
          throw new Error(
            `Field '${fieldName}' must be a string, got ${typeof value}`,
          );
        }
        break;
      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          throw new Error(`Field '${fieldName}' must be a valid number`);
        }
        break;
      case "date":
        if (!(value instanceof Date) || isNaN(value.getTime())) {
          throw new Error(`Field '${fieldName}' must be a valid Date`);
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") {
          throw new Error(`Field '${fieldName}' must be a boolean`);
        }
        break;
    }

    // Validation rules
    if (fieldDef.validation) {
      this.validateFieldRules(fieldName, value, fieldDef);
    }
  }

  private static validateFieldRules(
    fieldName: string,
    value: MetadataValue,
    fieldDef: MetadataFieldDefinition,
  ): void {
    const rules = fieldDef.validation!;

    if (fieldDef.type === "text" && typeof value === "string") {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        throw new Error(
          `Field '${fieldName}' must be at least ${rules.minLength} characters long`,
        );
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        throw new Error(
          `Field '${fieldName}' must be at most ${rules.maxLength} characters long`,
        );
      }
      if (
        rules.pattern !== undefined &&
        !new RegExp(rules.pattern).test(value)
      ) {
        throw new Error(`Field '${fieldName}' does not match required pattern`);
      }
    }

    if (fieldDef.type === "number" && typeof value === "number") {
      if (rules.minValue !== undefined && value < rules.minValue) {
        throw new Error(
          `Field '${fieldName}' must be at least ${rules.minValue}`,
        );
      }
      if (rules.maxValue !== undefined && value > rules.maxValue) {
        throw new Error(
          `Field '${fieldName}' must be at most ${rules.maxValue}`,
        );
      }
    }
  }

  getValue(fieldName: string): MetadataValue | undefined {
    return this.data.values.get(fieldName);
  }

  hasValue(fieldName: string): boolean {
    return this.data.values.has(fieldName);
  }

  getAllValues(): Record<string, MetadataValue> {
    const result: Record<string, MetadataValue> = {};
    for (const [key, value] of this.data.values.entries()) {
      result[key] = value;
    }
    return result;
  }

  updateValue(
    fieldName: string,
    value: MetadataValue,
    schema: MetadataSchema,
  ): MetadataValues {
    if (!schema.hasField(fieldName)) {
      throw new Error(`Field '${fieldName}' is not defined in schema`);
    }

    const fieldDef = schema.getField(fieldName)!;
    MetadataValues.validateFieldValue(fieldName, value, fieldDef);

    const newValues = new Map(this.data.values);
    newValues.set(fieldName, value);

    return new MetadataValues({
      values: newValues,
    });
  }

  removeValue(fieldName: string, schema: MetadataSchema): MetadataValues {
    if (!this.hasValue(fieldName)) {
      return this;
    }

    if (schema.isFieldRequired(fieldName)) {
      throw new Error(`Cannot remove required field '${fieldName}'`);
    }

    const newValues = new Map(this.data.values);
    newValues.delete(fieldName);

    return new MetadataValues({
      values: newValues,
    });
  }
}
