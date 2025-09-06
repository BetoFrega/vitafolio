export class Role {
  private constructor(private readonly value: string) {}

  static create(value: string): Role {
    if (!Role.isValid(value)) {
      throw new Error("Invalid role");
    }
    return new Role(value);
  }

  static isValid(value: string): boolean {
    return ["admin", "member"].includes(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }
}
