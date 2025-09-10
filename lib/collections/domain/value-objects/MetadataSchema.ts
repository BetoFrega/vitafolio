export type MetadataFieldType = "text" | "number" | "date" | "boolean";

export interface MetadataFieldDefinition {
  name: string;
  type: MetadataFieldType;
  required: boolean;
  validation?: ValidationRules;
  description?: string;
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
}

export class MetadataSchema {
  private constructor(
    public readonly data: {
      fields: Map<string, MetadataFieldDefinition>;
      requiredFields: Set<string>;
      version: number;
      lastModified: Date;
    },
  ) {
    Object.freeze(this.data);
  }

  static create(
    fields: Record<string, Omit<MetadataFieldDefinition, "name">>,
  ): MetadataSchema {
    this.validateFieldDefinitions(fields);

    const fieldsMap = new Map<string, MetadataFieldDefinition>();
    const requiredFields = new Set<string>();

    for (const [name, definition] of Object.entries(fields)) {
      const fieldDef: MetadataFieldDefinition = {
        name,
        ...definition,
      };

      fieldsMap.set(name, fieldDef);

      if (definition.required) {
        requiredFields.add(name);
      }
    }

    if (fieldsMap.size === 0) {
      throw new Error(
        "MetadataSchema must contain at least one field definition",
      );
    }

    return new MetadataSchema({
      fields: fieldsMap,
      requiredFields,
      version: 1,
      lastModified: new Date(),
    });
  }

  static fromData(data: {
    fields: Map<string, MetadataFieldDefinition>;
    requiredFields: Set<string>;
    version: number;
    lastModified: Date;
  }): MetadataSchema {
    return new MetadataSchema(data);
  }

  private static validateFieldDefinitions(
    fields: Record<string, Omit<MetadataFieldDefinition, "name">>,
  ): void {
    for (const [name, definition] of Object.entries(fields)) {
      if (!this.isValidFieldName(name)) {
        throw new Error(
          `Invalid field name: ${name}. Must be alphanumeric with underscores only`,
        );
      }

      if (!this.isValidFieldType(definition.type)) {
        throw new Error(
          `Invalid field type: ${definition.type}. Must be one of: text, number, date, boolean`,
        );
      }
    }
  }

  private static isValidFieldName(name: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }

  private static isValidFieldType(type: string): type is MetadataFieldType {
    return ["text", "number", "date", "boolean"].includes(type);
  }

  getField(name: string): MetadataFieldDefinition | undefined {
    return this.data.fields.get(name);
  }

  hasField(name: string): boolean {
    return this.data.fields.has(name);
  }

  isFieldRequired(name: string): boolean {
    return this.data.requiredFields.has(name);
  }

  getAllFields(): MetadataFieldDefinition[] {
    return Array.from(this.data.fields.values());
  }

  getRequiredFields(): string[] {
    return Array.from(this.data.requiredFields);
  }

  addField(
    name: string,
    definition: Omit<MetadataFieldDefinition, "name">,
  ): MetadataSchema {
    if (this.hasField(name)) {
      throw new Error(`Field ${name} already exists`);
    }

    const newFields = new Map(this.data.fields);
    const newRequiredFields = new Set(this.data.requiredFields);

    const fieldDef: MetadataFieldDefinition = {
      name,
      ...definition,
    };

    newFields.set(name, fieldDef);

    if (definition.required) {
      newRequiredFields.add(name);
    }

    return new MetadataSchema({
      fields: newFields,
      requiredFields: newRequiredFields,
      version: this.data.version + 1,
      lastModified: new Date(),
    });
  }

  removeField(name: string): MetadataSchema {
    if (!this.hasField(name)) {
      throw new Error(`Field ${name} does not exist`);
    }

    if (this.isFieldRequired(name)) {
      throw new Error(`Cannot remove required field ${name}`);
    }

    const newFields = new Map(this.data.fields);
    const newRequiredFields = new Set(this.data.requiredFields);

    newFields.delete(name);
    newRequiredFields.delete(name);

    if (newFields.size === 0) {
      throw new Error("Cannot remove the last field from schema");
    }

    return new MetadataSchema({
      fields: newFields,
      requiredFields: newRequiredFields,
      version: this.data.version + 1,
      lastModified: new Date(),
    });
  }
}
